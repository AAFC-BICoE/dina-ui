import { useContext, useMemo } from "react";
import useSWR from "swr";
import { useApiClient } from "./ApiClientContext";
import { v4 as uuidv4 } from "uuid";

export interface useElasticSearchQueryProps {
  indexName: string;
  queryDSL: any;

  /** onSuccess callback. */
  onSuccess?: (response: any) => void;

  /** Disables the query. */
  disabled?: boolean;

  /** Dependencies: When the values in this array are changed, re-fetch the data. */
  deps?: any[];
}

export function useElasticSearchQuery({
  indexName,
  queryDSL,
  onSuccess,
  disabled,
  deps
}: useElasticSearchQueryProps) {
  if (disabled) {
    return undefined;
  }
  const { apiClient } = useApiClient();
  const query = { ...queryDSL };

  async function fetchData() {
    if (disabled) {
      return undefined;
    }
    const response = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName
        }
      }
    );

    await onSuccess?.(response);

    return response;
  }

  const queryKey = JSON.stringify({ queryDSL, disabled, deps });

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

  return {
    error,
    loading,
    response: disabled || loading ? undefined : apiResponse,
    isDisabled: disabled
  };
}
