import { useApiClient } from "..";

/**
 * Elastic search by default will only count up to 10,000 records. If the search returns 10,000
 * as the page size, there is a good chance that there is more and the /count endpoint will need
 * to be used to get the actual total.
 */
const MAX_COUNT_SIZE: number = 10000;

export function performElasticSearch({
  dispatch,
  indexName,
  query,
  apiClient
}) {
  // Fetch data using elastic search.
  // The included section will be transformed from an array to an object with the type name for each relationship.
  elasticSearchRequest(query)
    .then(result => {
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
      if (result?.total.value === MAX_COUNT_SIZE) {
        elasticSearchCountRequest(query)
          .then(countResult => {
            totalRecords = countResult;
          })
          .catch(() => {
            dispatch({
              type: "ERROR",
              errorLabel:
                "Cannot reach elastic search server. Please try again later."
            });
            return;
          });
      } else {
        totalRecords = result?.total?.value ?? 0;
      }

      dispatch({
        type: "SUCCESS_TABLE_DATA",
        searchResults: processedResult,
        newTotal: totalRecords
      });
    })
    .catch(() => {
      dispatch({
        type: "ERROR",
        errorLabel:
          "Cannot reach elastic search server. Please try again later."
      });
      return;
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
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      elasticSearchQuery,
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
    const elasticSearchQuery = { query: { ...queryDSL?.query } };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/count`,
      elasticSearchQuery,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.count;
  }

  return;
}
