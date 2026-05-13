import { useApiClient } from "common-ui";
import { AxiosInstance } from "axios";
import { KitsuResource, PersistedResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { useEffect, useState } from "react";
import _ from "lodash";

interface SearchWsHit {
  _source?: any;
}

interface SearchWsResponse {
  hits?: {
    hits?: SearchWsHit[];
  };
}

export interface SearchWsCustomQueryOptions {
  indexName: string;
  searchQuery?: string;
  query: any | ((searchQuery: string) => any);
  size?: number;
}

export interface DoSearchWsParams {
  indexName: string;
  queryBuilder: (searchQuery: string) => any;
  searchQuery?: string;
  size?: number;
}

/**
 * Custom hook to execute a search-ws/search query and return deserialized resources, used as custom query for ResourceSelectFieldCustomQuery.
 * The query can be a static object or a function that takes the search query as an argument.
 * The search is executed whenever the search query changes.
 * The results are returned as deserialized resources.
 * @param param0
 * @returns
 */
export function useSearchWsCustomQuery<TData extends KitsuResource>({
  indexName,
  searchQuery,
  query,
  size = 20
}: SearchWsCustomQueryOptions): {
  loading?: boolean;
  response?: { data: PersistedResource<TData>[] };
} {
  const { apiClient } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<
    { data: PersistedResource<TData>[] } | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;

    async function fetchSearchResults() {
      setLoading(true);
      try {
        const builtQuery =
          typeof query === "function" ? query(searchQuery ?? "") : query;

        const results = await doSearchWsSearch<TData>(apiClient.axios, {
          indexName,
          queryBuilder: () => builtQuery,
          searchQuery: searchQuery ?? "",
          size
        });

        if (!cancelled) {
          setResponse({ data: results });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSearchResults();

    return () => {
      cancelled = true;
    };
  }, [apiClient, indexName, searchQuery, size]);

  return { loading, response };
}

/** Executes a search-ws/search query and returns deserialized resources. */
export async function doSearchWsSearch<TData extends KitsuResource>(
  axios: Pick<AxiosInstance, "post">,
  { indexName, queryBuilder, searchQuery = "", size = 20 }: DoSearchWsParams
): Promise<PersistedResource<TData>[]> {
  const query = queryBuilder(searchQuery);

  if (!query) {
    return [];
  }

  const searchResponse = await axios.post<SearchWsResponse>(
    "search-api/search-ws/search",
    { query, size },
    { params: { indexName } }
  );

  const docs = _.compact(
    (searchResponse.data?.hits?.hits ?? []).map((hit) => {
      const source = hit?._source;
      if (!source) {
        return undefined;
      }
      return source;
    })
  );

  const data = await Promise.all(
    docs.map(async (doc) => {
      const deserialized = await deserialise(doc as any);
      return deserialized.data as PersistedResource<TData>;
    })
  );

  return data;
}
