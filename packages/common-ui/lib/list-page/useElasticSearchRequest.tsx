import { KitsuResource } from "kitsu";
import { useState } from "react";
import { useRecoilState } from "recoil";
import { useApiClient } from "..";
import {
  applyPagination,
  applySortingRules,
  elasticSearchFormatExport
} from "./query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import {
  paginationState,
  sortingRulesState,
  loadingState,
  searchResultsState,
  totalRecordsState,
  queryTreeState,
  queryConfigState
} from "./recoil_state";
import { TableColumn } from "./types";

/**
 * Elastic search by default will only count up to 10,000 records. If the search returns 10,000
 * as the page size, there is a good chance that there is more and the /count endpoint will need
 * to be used to get the actual total.
 */
const MAX_COUNT_SIZE: number = 10000;

export interface UseElasticSearchRequestProps<TData extends KitsuResource> {
  indexName: string;

  /**
   * Columns to render on the table. This will also be used to map the data to a specific column.
   */
  columns: TableColumn<TData>[];
}

export function useElasticSearchRequest<TData extends KitsuResource>({
  indexName,
  columns
}: UseElasticSearchRequestProps<TData>) {
  const { apiClient } = useApiClient();

  const [pagination] = useRecoilState(paginationState);
  const [sortingRules] = useRecoilState(sortingRulesState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [searchResults, setSearchResults] = useRecoilState(searchResultsState);
  const [totalRecords, setTotalRecords] = useRecoilState(totalRecordsState);
  const [queryTree] = useRecoilState(queryTreeState);
  const [queryConfig] = useRecoilState(queryConfigState);

  // Query Page error message state
  const [error, setError] = useState<any>();

  function performElasticSearchRequest() {
    if (!queryTree || !queryConfig) return;

    setLoading(true);
    setError(undefined);

    // Elastic search query with pagination settings.
    const queryDSL = applySortingRules(
      applyPagination(
        elasticSearchFormatExport(queryTree, queryConfig),
        pagination
      ),
      sortingRules,
      columns
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
        if (result?.total.value === MAX_COUNT_SIZE) {
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

  return { performElasticSearchRequest };
}
