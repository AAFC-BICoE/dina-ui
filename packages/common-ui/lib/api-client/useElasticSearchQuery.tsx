import { useContext, useMemo } from "react";
import useSWR from "swr";
import { useApiClient } from "./ApiClientContext";
import { v4 as uuidv4 } from "uuid";

export interface UseElasticSearchQueryProps {
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
}: UseElasticSearchQueryProps) {
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

    if (!response) {
      // This warning may appear in tests where apiClient.get hasn't been mocked:
      console.warn(
        "No response returned from apiClient.get for query: ",
        query
      );
    }

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
