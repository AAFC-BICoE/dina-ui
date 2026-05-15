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
  // search query string, used as an argument for the query if the query is a function
  searchQuery?: string;
  //function that takes the search query as an argument
  query: (searchQuery: string) => any;
  size?: number;
}

export interface DoSearchWsParams {
  indexName: string;
  // function to generate the query based on the search query, which is passed as an argument. The search query is optional and can be an empty string if not needed for the query.
  queryBuilder: (searchQuery?: string) => any;
  // search query string, used as an argument for the queryBuilder if it is a function
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
        const results = await doSearchWsSearch<TData>(apiClient.axios, {
          indexName,
          queryBuilder: query,
          searchQuery: searchQuery,
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

/**
 * Does the search against the search-ws/search API and returns deserialized resources.
 * @param axios axios instance to use for the request
 * @param indexName index to search against
 * @param queryBuilder function to generate the query based on the search query, which is passed as an argument. The search query is optional and can be an empty string if not needed for the query.
 * @param searchQuery search query string, used as an argument for the queryBuilder if it is a function
 * @returns deserialized resources returned from the search API
 */
async function doSearchWsSearch<TData extends KitsuResource>(
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
