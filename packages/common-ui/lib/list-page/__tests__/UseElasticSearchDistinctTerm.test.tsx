import { useEffect } from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useElasticSearchDistinctTerm } from "../useElasticSearchDistinctTerm";
import { isEmpty } from "lodash";

const FIELD_NAME = "data.attributes.materialSampleType";
const RELATIONSHIP_FIELD_NAME = "included.attributes.code";
const RELATIONSHIP_TYPE = "collection";
const INDEX_NAME = "dina-material-sample-index";
const GROUPS = ["aafc"];

interface UseElasticSearchDistinctTermWrapperProps {
  searchResultsRetrieved: (results: string[]) => void;
  emptyResultsRetrieved?: () => void;
  fieldName?: string;
  groups?: string[];
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
  emptyResultsRetrieved,
  fieldName,
  groups = GROUPS,
  relationshipType
}: UseElasticSearchDistinctTermWrapperProps) {
  const searchResults = useElasticSearchDistinctTerm({
    fieldName,
    relationshipType,
    groups,
    indexName: INDEX_NAME
  });

  useEffect(() => {
    if (!isEmpty(searchResults)) {
      searchResultsRetrieved(searchResults);
    } else {
      emptyResultsRetrieved?.();
    }
  }, [searchResults]);

  return <></>;
}

const mockSearchResults = jest.fn();
const mockEmptyResults = jest.fn();

const mockSuggestionRequest = jest.fn<any, any>(async (path) => {
  if (path === "search-api/search-ws/search") {
    return {
      data: {
        took: 28,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: 5, relation: "eq" },
          max_score: null,
          hits: []
        },
        aggregations: {
          term_aggregation: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: "WHOLE_ORGANISM", doc_count: 1 }]
          }
        }
      }
    };
  }
});

const mockSuggestionRequestRelationship = jest.fn<any, any>(async (path) => {
  if (path === "search-api/search-ws/search") {
    return {
      data: {
        took: 123,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: 5, relation: "eq" },
          max_score: null,
          hits: []
        },
        aggregations: {
          included_aggregation: {
            doc_count: 4,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    expect(mockSearchResults).toBeCalledWith(["WHOLE_ORGANISM"]);
  });

  it("Relationship suggestions retrieved", async () => {
    const wrapper = mountWithAppContext(
      <UseElasticSearchDistinctTermWrapper
        fieldName={RELATIONSHIP_FIELD_NAME}
        relationshipType={RELATIONSHIP_TYPE}
        searchResultsRetrieved={(results: any) => {
          mockSearchResults(results);
        }}
      />,
      {
        apiContext: {
          apiClient: {
            axios: { post: mockSuggestionRequestRelationship } as any
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSuggestionRequestRelationship).toBeCalledWith(
      "search-api/search-ws/search",
      {
        size: 0,
        query: { terms: { "data.attributes.group": GROUPS } },
        aggs: {
          included_aggregation: {
            nested: { path: "included" },
            aggs: {
              included_type_filter: {
                filter: {
                  bool: {
                    filter: [{ term: { "included.type": RELATIONSHIP_TYPE } }]
                  }
                },
                aggs: {
                  term_aggregation: {
                    terms: {
                      field: RELATIONSHIP_FIELD_NAME + ".keyword",
                      size: 100
                    }
                  }
                }
              }
            }
          }
        }
      },
      { params: { indexName: "dina-material-sample-index" } }
    );

    expect(mockSearchResults).toBeCalledWith(["CNC"]);
  });

  describe("Error handling / Props not provided cases", () => {
    it("Unable to retrieve results, empty suggestion list returned", async () => {
      const wrapper = mountWithAppContext(
        <UseElasticSearchDistinctTermWrapper
          fieldName={FIELD_NAME}
          searchResultsRetrieved={(results: any) => {
            mockSearchResults(results);
          }}
          emptyResultsRetrieved={() => {
            mockEmptyResults();
          }}
        />,
        {
          apiContext: {
            apiClient: {
              axios: {
                post: jest.fn().mockRejectedValue(new Error())
              } as any
            }
          }
        }
      );

      await new Promise(setImmediate);
      wrapper.update();

      // No search results should be provided.
      expect(mockSearchResults).toBeCalledTimes(0);

      // The initial load sets it to an empty result as well.
      expect(mockEmptyResults).toBeCalledTimes(2);
    });

    it("No field name provided, no results should be returned.", async () => {
      const wrapper = mountWithAppContext(
        <UseElasticSearchDistinctTermWrapper
          searchResultsRetrieved={(results: any) => {
            mockSearchResults(results);
          }}
          emptyResultsRetrieved={() => {
            mockEmptyResults();
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

      expect(mockSuggestionRequest).toBeCalledTimes(0);
      expect(mockEmptyResults).toBeCalledTimes(1);
    });

    it("No group provided, the query should not include group", async () => {
      const wrapper = mountWithAppContext(
        <UseElasticSearchDistinctTermWrapper
          fieldName={FIELD_NAME}
          searchResultsRetrieved={(results: any) => {
            mockSearchResults(results);
          }}
          groups={[]}
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
              terms: {
                field: "data.attributes.materialSampleType.keyword",
                size: 100
              }
            }
          },
          size: 0
        },
        { params: { indexName: "dina-material-sample-index" } }
      );
      expect(mockSearchResults).toBeCalledWith(["WHOLE_ORGANISM"]);
    });
  });
});
