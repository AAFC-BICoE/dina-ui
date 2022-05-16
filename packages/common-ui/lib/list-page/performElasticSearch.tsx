import { QueryPageActions } from "./queryPageReducer";

/**
 * Elastic search by default will only count up to 10,000 records. If the search returns 10,000
 * as the page size, there is a good chance that there is more and the /count endpoint will need
 * to be used to get the actual total.
 */
const MAX_COUNT_SIZE: number = 10000;

interface PerformElasticSearchProps {
  dispatch: React.Dispatch<QueryPageActions>;
  indexName: string;
  query: any;
  apiClient: any;
}

export function performElasticSearch({
  dispatch,
  indexName,
  query,
  apiClient
}: PerformElasticSearchProps) {
  // Fetch data using elastic search.
  // The included section will be transformed from an array to an object with the type name for each relationship.
  elasticSearchRequest(query)
    .then(response => {
      const result = response?.data?.hits;

      const processedResult = result?.hits.map(rslt => ({
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
      let totalRecords = 0;
      let countError = false;
      if (result?.total.value === MAX_COUNT_SIZE) {
        elasticSearchCountRequest(query)
          .then(countResponse => {
            totalRecords = countResponse?.data?.count;
          })
          .catch(error => {
            countError = true;
            handleError(error);
          });
      } else {
        totalRecords = result?.total?.value ?? 0;
      }

      // Perform the action to set the results and stop all loading.
      if (!countError) {
        dispatch({
          type: "SUCCESS_TABLE_DATA",
          searchResults: processedResult,
          newTotal: totalRecords
        });
      }
    })
    .catch(error => {
      handleError(error);
    });

  /**
   * Asynchronous POST request for elastic search. Used to retrieve elastic search results against
   * the indexName in the prop.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
  async function elasticSearchRequest(queryDSL) {
    const elasticSearchQuery = { ...queryDSL };
    return await apiClient.axios.post(
      `search-api/search-ws/search`,
      elasticSearchQuery,
      {
        params: {
          indexName
        }
      }
    );
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
    const elasticSearchQuery = { query: { ...queryDSL?.query } };
    return await apiClient.axios.post(
      `search-api/search-ws/count`,
      elasticSearchQuery,
      {
        params: {
          indexName
        }
      }
    );
  }

  /**
   * Dispatch the error action. This will stop all loading and set an error message on the page.
   */
  function handleError(error) {
    dispatch({ type: "ERROR", errorLabel: error.toString() });
  }

  return;
}
