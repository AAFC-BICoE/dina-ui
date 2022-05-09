import { last } from "lodash";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useElasticSearchDistinctTerm } from "../useElasticSearchDistinctTerm";

/**
 * Mock of the elastic search suggestion query. This is used for the auto-complete dropdowns. This
 * is only supported on options with the distinctTerm option as true.
 *
 * The relationship one is a bit more complicated an uses the "included_aggregation" part.
 */
const MOCK_ELASTIC_SEARCH_RELATIONSHIP_SUGGESTIONS = {
  data: {
    hits: { total: { value: 8, relation: "eq" }, max_score: null, hits: [] },
    aggregations: {
      included_aggregation: {
        doc_count: 8,
        term_aggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [
            { key: "Suggestion 1", doc_count: 3 },
            { key: "Suggestion 2", doc_count: 2 },
            { key: "Suggestion 3", doc_count: 2 },
            { key: "Suggestion 4", doc_count: 1 }
          ]
        }
      }
    }
  }
};

/**
 * Mock of the elastic search suggestion query. This is used for the auto-complete dropdowns. This
 * is only supported on options with the distinctTerm option as true.
 *
 * This is the more simple version when using it with attributes.
 */
const MOCK_ELASTIC_SEARCH_ATTRIBUTE_SUGGESTIONS = {
  data: {
    hits: { total: { value: 8, relation: "eq" }, max_score: null, hits: [] },
    aggregations: {
      term_aggregation: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          { key: "Suggestion 1", doc_count: 3 },
          { key: "Suggestion 2", doc_count: 2 },
          { key: "Suggestion 3", doc_count: 2 },
          { key: "Suggestion 4", doc_count: 1 }
        ]
      }
    }
  }
};

describe("useElasticSearchDistinctTerm hook", () => {
  it("Attribute elastic search suggestion testing", async () => {
    const hookReturnValue = jest.fn();

    function TestComponent() {
      hookReturnValue(
        useElasticSearchDistinctTerm({
          fieldName: "data.attributes.testFieldName",
          groups: ["aafc"],
          indexName: "testIndexName"
        })
      );
      return null;
    }

    const mockPost = jest.fn<any, any>(
      async _ => MOCK_ELASTIC_SEARCH_ATTRIBUTE_SUGGESTIONS
    );

    const apiContext: any = {
      apiClient: {
        axios: {
          post: mockPost
        }
      }
    };

    mountWithAppContext(<TestComponent />, {
      apiContext
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(hookReturnValue).toHaveBeenCalledTimes(1);

    // Ensure it has been called properly.
    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {
        aggs: {
          term_aggregation: {
            terms: {
              field: "data.attributes.testFieldName.keyword",
              size: 100
            }
          }
        },
        query: {
          terms: {
            "data.attributes.group": ["aafc"]
          }
        },
        size: 0
      },
      {
        params: {
          indexName: "testIndexName"
        }
      }
    ]);

    await new Promise(setImmediate);
    expect(hookReturnValue.mock.calls.pop()).toEqual([
      ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]
    ]);
  });

  it("Relationship elastic search suggestion testing", async () => {
    const hookReturnValue = jest.fn();

    function TestComponent() {
      hookReturnValue(
        useElasticSearchDistinctTerm({
          fieldName: "included.attributes.testFieldName",
          groups: ["aafc"],
          indexName: "testIndexName",
          relationshipType: "relationship-type"
        })
      );
      return null;
    }

    const mockPost = jest.fn<any, any>(
      async _ => MOCK_ELASTIC_SEARCH_RELATIONSHIP_SUGGESTIONS
    );

    const apiContext: any = {
      apiClient: {
        axios: {
          post: mockPost
        }
      }
    };

    mountWithAppContext(<TestComponent />, {
      apiContext
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(hookReturnValue).toHaveBeenCalledTimes(1);

    // Ensure it has been called properly.
    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {
        aggs: {
          included_aggregation: {
            aggs: {
              term_aggregation: {
                terms: {
                  field: "included.attributes.testFieldName.keyword",
                  size: 100
                }
              }
            },
            nested: {
              path: "included"
            }
          }
        },
        query: {
          bool: {
            must: [
              {
                terms: {
                  "data.attributes.group": ["aafc"]
                }
              },
              {
                nested: {
                  path: "included",
                  query: {
                    match: {
                      "included.type": "relationship-type"
                    }
                  }
                }
              }
            ]
          }
        },
        size: 0
      },
      {
        params: {
          indexName: "testIndexName"
        }
      }
    ]);

    await new Promise(setImmediate);
    expect(hookReturnValue.mock.calls.pop()).toEqual([
      ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]
    ]);
  });

  it("No group filtering option", async () => {
    const hookReturnValue = jest.fn();

    function TestComponent() {
      hookReturnValue(
        useElasticSearchDistinctTerm({
          fieldName: "data.attributes.testFieldName",
          groups: [],
          indexName: "testIndexName"
        })
      );
      return null;
    }

    const mockPost = jest.fn<any, any>(
      async _ => MOCK_ELASTIC_SEARCH_ATTRIBUTE_SUGGESTIONS
    );

    const apiContext: any = {
      apiClient: {
        axios: {
          post: mockPost
        }
      }
    };

    mountWithAppContext(<TestComponent />, {
      apiContext
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(hookReturnValue).toHaveBeenCalledTimes(1);

    // Ensure it has been called properly.
    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {
        aggs: {
          term_aggregation: {
            terms: {
              field: "data.attributes.testFieldName.keyword",
              size: 100
            }
          }
        },
        size: 0
      },
      {
        params: {
          indexName: "testIndexName"
        }
      }
    ]);

    await new Promise(setImmediate);
    expect(hookReturnValue.mock.calls.pop()).toEqual([
      ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]
    ]);
  });

  it("elastic search not available, empty suggestions returned", async () => {
    const hookReturnValue = jest.fn();

    function TestComponent() {
      hookReturnValue(
        useElasticSearchDistinctTerm({
          fieldName: "testFieldName",
          groups: ["aafc"],
          indexName: "testIndexName"
        })
      );
      return null;
    }

    mountWithAppContext(<TestComponent />).update();

    await new Promise(setImmediate);
    expect(hookReturnValue.mock.calls[0]).toEqual([[]]);
  });
});
