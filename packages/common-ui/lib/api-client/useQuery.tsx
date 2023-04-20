import { DocWithErrors } from "jsonapi-typescript";
import { GetParams, KitsuResponse, KitsuResponseData } from "kitsu";
import { isArray, isUndefined, omitBy } from "lodash";
import { useContext, useDebugValue, useMemo } from "react";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { ApiClientContext } from "./ApiClientContext";
import { ClientSideJoiner, ClientSideJoinSpec } from "./client-side-join";

/** Attributes that compose a JsonApi query. */
export interface JsonApiQuerySpec extends GetParams {
  path: string;
  header?: {};
}

/** Query hook state. */
export interface QueryState<TData extends KitsuResponseData, TMeta> {
  /** Boolean indicating the loading status. */
  loading: boolean;

  /** Undefined if no errors have occurred. Error structure can change depending on the endpoint. */
  error?: DocWithErrors;

  /** Response from the API request. If loading/error/disabled it will be undefined. */
  response?: KitsuResponse<TData, TMeta>;

  /** Has the request been disabled. Disabled requests return undefined results. */
  isDisabled?: boolean;
}

/** Additional query options. */
export interface QueryOptions<TData extends KitsuResponseData, TMeta> {
  /** Dependencies: When the values in this array are changed, re-fetch the data. */
  deps?: any[];

  /** onSuccess callback. */
  onSuccess?: (response: KitsuResponse<TData, TMeta>) => void;

  /** Client-side joins across multiple back-end APIs. */
  joinSpecs?: ClientSideJoinSpec[];

  /** Disables the query. */
  disabled?: boolean;
}

/**
 * Back-end connected React hook for running queries agains the back-end.
 * It fetches the data again if the passed query changes.
 */
export function useQuery<TData extends KitsuResponseData, TMeta = undefined>(
  querySpec: JsonApiQuerySpec,
  {
    deps = [],
    joinSpecs = [],
    onSuccess,
    disabled = false
  }: QueryOptions<TData, TMeta> = {}
): QueryState<TData, TMeta> {
  const { apiClient, bulkGet } = useContext(ApiClientContext);
  // Memoize the callback. Only re-create it when the query spec changes.
  async function fetchData() {
    if (disabled) {
      return undefined;
    }

    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?fields=undefined
    const { path, fields, filter, sort, include, page, header } = querySpec;
    const getParams = omitBy<GetParams>(
      { fields, filter, sort, include, page, header },
      isUndefined
    );

    const response = await apiClient.get<TData, TMeta>(path, getParams);

    if (!response) {
      // This warning may appear in tests where apiClient.get hasn't been mocked:
      console.warn(
        "No response returned from apiClient.get for query: ",
        querySpec
      );
    }

    await onSuccess?.(response);

    if (joinSpecs) {
      const { data } = response;
      const resources = isArray(data) ? data : [data];

      for (const joinSpec of joinSpecs) {
        await new ClientSideJoiner(bulkGet, resources, joinSpec).join();
      }
    }

    return response;
  }

  const queryKey = JSON.stringify({ querySpec, disabled, deps });

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const cacheId = useMemo(() => uuidv4(), [queryKey]);

  const {
    data: apiResponse,
    error,
    isValidating: loading
  } = useSWR([queryKey, cacheId], fetchData, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  useDebugValue({ querySpec });

  return {
    error,
    loading,
    response: disabled || loading ? undefined : apiResponse,
    isDisabled: disabled
  };
}

/**
 * Only render if there is a response, otherwise show generic 'loading' or 'error' indicators.
 *
 * If the response is disabled, it will NOT go through with the rendering.
 */
export function withResponse<
  TData extends KitsuResponseData,
  TMeta = undefined
>(
  { loading, error, response }: QueryState<TData, TMeta>,
  responseRenderer: (
    response: KitsuResponse<TData, TMeta>
  ) => JSX.Element | null
): JSX.Element | null {
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }
  if (error) {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : error?.errors?.map((e) => e.detail).join("\n") ?? String(error);

    return <div className="alert alert-danger">{message}</div>;
  }
  if (response) {
    return responseRenderer(response);
  }
  return null;
}

/**
 * Only render if there is a response or is disabled, otherwise show generic 'loading' or 'error'
 * indicators.
 *
 * If the response is disabled, it will go through with the rendering. This is great for cases where
 * you want to render if the response is disabled to be skipped. Only wait to render if it's not
 * disabled.
 */
export function withResponseOrDisabled<
  TData extends KitsuResponseData,
  TMeta = undefined
>(
  { loading, error, response, isDisabled }: QueryState<TData, TMeta>,
  responseRenderer: (
    response?: KitsuResponse<TData, TMeta>
  ) => JSX.Element | null
): JSX.Element | null {
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }
  if (error) {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : error?.errors?.map((e) => e.detail).join("\n") ?? String(error);

    return <div className="alert alert-danger">{message}</div>;
  }
  if (response || isDisabled) {
    return responseRenderer(response);
  }
  return null;
}
