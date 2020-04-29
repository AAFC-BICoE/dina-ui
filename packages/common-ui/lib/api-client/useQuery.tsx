import { DocWithErrors } from "jsonapi-typescript";
import { GetParams, KitsuResponse, KitsuResponseData } from "kitsu";
import { isUndefined, omitBy } from "lodash";
import { ReactNode, useCallback, useContext, useRef } from "react";
import { useAsyncRun, useAsyncTask } from "react-hooks-async";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { ApiClientContext } from "./ApiClientContext";

/** Attributes that compose a JsonApi query. */
export interface JsonApiQuerySpec extends GetParams {
  path: string;
}

/** Query hook state. */
export interface QueryState<TData extends KitsuResponseData, TMeta> {
  loading: boolean;
  error?: DocWithErrors;
  response?: KitsuResponse<TData, TMeta>;
}

/** Additional query options. */
export interface QueryOptions<TData extends KitsuResponseData, TMeta> {
  /** Dependencies: When the values in this array are changed, re-fetch the data. */
  deps?: any[];

  /** onSuccess callback. */
  onSuccess?: (response: KitsuResponse<TData, TMeta>) => void;
}

/**
 * Back-end connected React hook for running queries agains the back-end.
 * It fetches the data again if the passed query changes.
 */
export function useQuery<TData extends KitsuResponseData, TMeta = undefined>(
  querySpec: JsonApiQuerySpec,
  options: QueryOptions<TData, TMeta> = {}
): QueryState<TData, TMeta> {
  const { apiClient } = useContext(ApiClientContext);

  const previousResponseRef = useRef<KitsuResponse<TData, TMeta> | undefined>(
    undefined
  );

  // Memoize the callback. Only re-create it when the query spec changes.
  const fetchData = useCallback(() => {
    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?fields=undefined
    const { path, fields, filter, sort, include, page } = querySpec;
    const getParams = omitBy<GetParams>(
      { fields, filter, sort, include, page },
      isUndefined
    );

    const request = apiClient.get<TData, TMeta>(path, getParams);
    if (options.onSuccess) {
      request.then(options.onSuccess);
    }
    return request;
  }, [JSON.stringify(querySpec), ...(options.deps ? options.deps : [])]);

  // fetchData function should re-run when the query spec changes.
  const task = useAsyncTask(fetchData);
  useAsyncRun(task);

  // When the hook is re-fetching after a change of props, provide the previous response while loading.
  if (task.result && task.result !== previousResponseRef.current) {
    previousResponseRef.current = task.result;
  }

  return {
    error: task.error as any,
    loading: !!task.pending,
    response: previousResponseRef.current
  };
}

/** Only render if there is a response, otherwise show generic loading and error states. */
export function withResponse<
  TData extends KitsuResponseData,
  TMeta = undefined
>(
  { loading, error, response }: QueryState<TData, TMeta>,
  responseRenderer: (response: KitsuResponse<TData, TMeta>) => JSX.Element
): JSX.Element | null {
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }
  if (error) {
    return <div className="alert alert-danger">{status}</div>;
  }
  if (response) {
    return responseRenderer(response);
  }
  return null;
}
