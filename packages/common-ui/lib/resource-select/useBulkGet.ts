import { KitsuResource, PersistedResource } from "kitsu";
import useSWR from "swr";
import { Fragment, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useApiClient } from "..";

export interface UseBulkGetParams {
  ids: string[];
  listPath: string;
  disabled?: boolean;
}

const LIST_PATH_REGEX = /^(.*)\/(.*)$/;

export function useBulkGet<TData extends KitsuResource>({
  ids,
  listPath,
  disabled
}: UseBulkGetParams) {
  const { bulkGet } = useApiClient();

  async function fetchResources(): Promise<
    (TData | KitsuResource)[] | undefined
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

    const fetched = await bulkGet<TData, true>(paths, {
      apiBaseUrl: `/${apiBaseUrl}`,
      returnNullForMissingResource: true
    });

    const fetchedNonNull = fetched.map(
      (resource, idx) => resource ?? { id: ids[idx], type: typeName }
    );

    return fetchedNonNull;
  }

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const queryKey = JSON.stringify({ ids, disabled });
  const cacheId = useMemo(() => uuidv4(), [queryKey]);

  const { data, isValidating } = useSWR([cacheId], fetchResources, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return { data, loading: isValidating };
}
