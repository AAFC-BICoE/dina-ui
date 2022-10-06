import { KitsuResource } from "kitsu";
import { useState } from "react";
import { Config, ImmutableTree } from "react-awesome-query-builder";
import { SortingRule } from "react-table";
import { LimitOffsetPageSpec, useApiClient } from "..";
import {
  applyPagination,
  elasticSearchFormatExport
} from "./query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";

export interface UseElasticSearchRequestProps {
  indexName: string;
  maxCountSize: number;
  setError: React.Dispatch<any>;
  setLoading: React.Dispatch<boolean>;
}

export interface PerformElasticSearchRequestProps {
  queryBuilderTree?: ImmutableTree;
  queryBuilderConfig?: Config;
  pagination: LimitOffsetPageSpec;
  sortingRules: SortingRule[];
}

export function useElasticSearchRequest<TData extends KitsuResource>({
  indexName,
  maxCountSize,
  setError,
  setLoading
}: UseElasticSearchRequestProps) {
  const { apiClient } = useApiClient();

  // Search results returned by Elastic Search
  const [searchResults, setSearchResults] = useState<TData[]>([]);

  // Total number of records from the query. This is not the total displayed on the screen.
  const [totalRecords, setTotalRecords] = useState<number>(0);

  function performElasticSearchRequest({
    queryBuilderTree,
    queryBuilderConfig,
    pagination,
    sortingRules
  }: PerformElasticSearchRequestProps) {
    if (!queryBuilderTree || !queryBuilderConfig) return;

    setLoading(true);
    setError(undefined);

    // Elastic search query with pagination settings.
    const queryDSL = applyPagination(
      elasticSearchFormatExport(queryBuilderTree, queryBuilderConfig),
      pagination
    );

    // console.log(JSON.stringify(queryDSL));

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!queryDSL || !Object.keys(queryDSL).length) return;

    // Fetch data using elastic search.
    // The included section will be transformed from an array to an object with the type name for each relationship.
    elasticSearchRequest(queryDSL)
      .then((result) => {
        const processedResult = result?.hits.map((rslt) => ({
          id: rslt._source?.data?.id,
          type: rslt._source?.data?.type,
          data: {
            attributes: rslt._source?.data?.attributes
          },
          included: rslt._source?.included?.reduce(
            (array, currentIncluded) => (
              (array[currentIncluded?.type] = currentIncluded), array
            ),
            {}
          )
        }));
        // If we have reached the count limit, we will need to perform another request for the true
        // query size.
        if (result?.total.value === maxCountSize) {
          elasticSearchCountRequest(queryDSL)
            .then((countResult) => {
              setTotalRecords(countResult);
            })
            .catch((elasticSearchError) => {
              setError(elasticSearchError);
            });
        } else {
          setTotalRecords(result?.total?.value ?? 0);
        }

        // setAvailableResources(processedResult);
        setSearchResults(processedResult);
      })
      .catch((elasticSearchError) => {
        setError(elasticSearchError);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  /**
   * Asynchronous POST request for elastic search. Used to retrieve elastic search results against
   * the indexName in the prop.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
  async function elasticSearchRequest(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.hits;
  }

  /**
   * Asynchronous POST request for elastic search count API. By default, the elastic search will
   * only provide the count until `MAX_COUNT_SIZE`. This call is used to get the accurate total
   * count for larger search sets.
   *
   * @param queryDSL query filters are only used, pagination and sorting are ignored.
   * @returns Elastic search count response.
   */
  async function elasticSearchCountRequest(queryDSL) {
    const query = { query: { ...queryDSL?.query } };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/count`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.count;
  }

  return {
    performElasticSearchRequest,
    searchResults,
    totalRecords
  };
}
