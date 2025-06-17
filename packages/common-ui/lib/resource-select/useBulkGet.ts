import { KitsuResource, PersistedResource } from "kitsu";
import useSWR from "swr";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useApiClient } from "..";

export interface UseBulkGetParams {
  ids: string[];
  listPath: string;
  disabled?: boolean;
  /** onSuccess callback. */
  onSuccess?: (response) => void;
}

const LIST_PATH_REGEX = /^(.*)\/(.*)$/;

interface FetchResourcesResponse<TData extends KitsuResource> {
  /** The data with nulls in place of missing resources. */
  fetchedWithNulls: (PersistedResource<TData> | null)[];
  /** The data with KitsuResource objects (id and type) in place of missing resources. */
  fetchedWithoutNulls: PersistedResource<TData | KitsuResource>[];
}

export function useBulkGet<TData extends KitsuResource>({
  ids,
  listPath,
  disabled,
  onSuccess
}: UseBulkGetParams) {
  const { bulkGet } = useApiClient();

  async function fetchResources(): Promise<
    FetchResourcesResponse<TData> | undefined
  > {
    if (disabled) {
      return undefined;
    }
    // Enable bulk get to handle include
    const includeIdx = listPath.lastIndexOf("?include");
    const includes = includeIdx > 0 ? listPath.substring(includeIdx) : null;
    const myListPath = includes
      ? listPath.substring(0, listPath.lastIndexOf(includes))
      : listPath;

    const listPathMatch = LIST_PATH_REGEX.exec(myListPath);

    if (!listPathMatch) {
      return undefined;
    }
    const [_, apiBaseUrl, typeName] = listPathMatch;
    const paths = ids.map((id) => `${typeName}/${id}${includes ?? ""}`);

    const fetchedWithNulls = await bulkGet<TData, true>(paths, {
      apiBaseUrl: `/${apiBaseUrl}`,
      returnNullForMissingResource: true
    });

    await onSuccess?.(fetchedWithNulls);

    const fetchedWithoutNulls = fetchedWithNulls.map(
      (resource, idx) => resource ?? { id: ids[idx], type: typeName }
    );

    return { fetchedWithNulls, fetchedWithoutNulls };
  }

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const queryKey = JSON.stringify({ ids, disabled });
  const cacheId = useMemo(() => uuidv4(), [queryKey]);

  const { data: fetchResponse, isLoading } = useSWR([cacheId], fetchResources, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const data = fetchResponse?.fetchedWithoutNulls;
  const dataWithNullForMissing = fetchResponse?.fetchedWithNulls;

  return { data, dataWithNullForMissing, loading: isLoading };
}
