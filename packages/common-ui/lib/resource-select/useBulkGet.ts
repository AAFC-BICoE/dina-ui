import { KitsuResource, PersistedResource } from "kitsu";
import useSWR from "swr";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useApiClient } from "..";

export interface UseBulkGetParams {
  ids: string[];
  listPath: string;
  disabled?: boolean;
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
  disabled
}: UseBulkGetParams) {
  const { bulkGet } = useApiClient();

  async function fetchResources(): Promise<
    FetchResourcesResponse<TData> | undefined
  > {
    if (disabled) {
      return undefined;
    }

    const listPathMatch = LIST_PATH_REGEX.exec(listPath);

    if (!listPathMatch) {
      return undefined;
    }
    const [_, apiBaseUrl, typeName] = listPathMatch;
    const paths = ids.map(id => `${typeName}/${id}`);

    const fetchedWithNulls = await bulkGet<TData, true>(paths, {
      apiBaseUrl: `/${apiBaseUrl}`,
      returnNullForMissingResource: true
    });

    const fetchedWithoutNulls = fetchedWithNulls.map(
      (resource, idx) => resource ?? { id: ids[idx], type: typeName }
    );

    return { fetchedWithNulls, fetchedWithoutNulls };
  }

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const queryKey = JSON.stringify({ ids, disabled });
  const cacheId = useMemo(() => uuidv4(), [queryKey]);

  const { data: fetchResponse, isValidating } = useSWR(
    [cacheId],
    fetchResources,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const data = fetchResponse?.fetchedWithoutNulls;
  const dataWithNullForMissing = fetchResponse?.fetchedWithNulls;

  return { data, dataWithNullForMissing, loading: isValidating };
}
