import { useEffect } from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useElasticSearchDistinctTerm } from "../useElasticSearchDistinctTerm";
import { isEmpty } from "lodash";

const FIELD_NAME = "name";
const RELATIONSHIP_FIELD_NAME = "";
const INDEX_NAME = "dina-material-sample-index";
const GROUPS = ["aafc"];

interface UseElasticSearchDistinctTermWrapperProps {
  searchResultsRetrieved: (results: string[]) => void;
  fieldName: string;
  relationshipType?: string;
}

/**
 * Since we are testing a react hook, we will need to create a component that we can use
 * to retrieve the data from the hook.
 *
 * @param indexMapRetrieved Callback when the index mapping is retrieved.
 * @returns Blank component.
 */
function UseElasticSearchDistinctTermWrapper({
  searchResultsRetrieved,
  fieldName,
  relationshipType
}: UseElasticSearchDistinctTermWrapperProps) {
  const searchResults = useElasticSearchDistinctTerm({
    fieldName,
    relationshipType,
    groups: GROUPS,
    indexName: INDEX_NAME
  });

  useEffect(() => {
    if (!isEmpty(searchResults)) {
      searchResultsRetrieved(searchResults);
    }
  }, [searchResults]);

  return <></>;
}

const mockSearchResults = jest.fn();

const mockSuggestionRequest = jest.fn<any, any>(async (path) => {
  if (path === "/search-api/search-ws/search") {
    return {
      data: {
        took: 9,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: 4, relation: "eq" },
          max_score: null,
          hits: []
        },
        aggregations: {
          included_aggregation: {
            doc_count: 9,
            included_type_filter: {
              doc_count: 3,
              term_aggregation: {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: [{ key: "CNC", doc_count: 3 }]
              }
            }
          }
        }
      }
    };
  }
});

describe("Use Elastic Search Distinct Term Hook", () => {
  it("Non-relationship suggestions retrieved", async () => {
    const wrapper = mountWithAppContext(
      <UseElasticSearchDistinctTermWrapper
        fieldName={FIELD_NAME}
        searchResultsRetrieved={(results: any) => {
          mockSearchResults(results);
        }}
      />,
      {
        apiContext: {
          apiClient: {
            axios: { post: mockSuggestionRequest } as any
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSuggestionRequest).toBeCalledWith(
      "search-api/search-ws/search",
      {
        aggs: {
          term_aggregation: {
            terms: { field: FIELD_NAME + ".keyword", size: 100 }
          }
        },
        query: { terms: { "data.attributes.group": GROUPS } },
        size: 0
      },
      { params: { indexName: INDEX_NAME } }
    );

    expect(mockSearchResults).toBeCalledWith();
  });

  // it("Relationship suggestions retrieved", async () => {});
});
