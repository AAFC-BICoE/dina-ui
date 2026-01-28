import { waitFor, act, renderHook } from "@testing-library/react";
import { useMultiIndexSearch } from "../useMultiIndexSearch";
import { MockAppContextProvider } from "../../test-util/mock-app-context";

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid")
}));

const mockPost = jest.fn();

const mockApiContext = {
  apiClient: {
    get: jest.fn(),
    axios: {
      post: mockPost
    } as any
  }
};

const mockAccountContext = {
  groupNames: ["aafc", "cnc"]
};

/**
 * Helper wrapper for renderHook
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MockAppContextProvider
      apiContext={mockApiContext}
      accountContext={mockAccountContext}
    >
      {children}
    </MockAppContextProvider>
  );
}

/**
 * Mock Elasticsearch aggregation response
 */
const MOCK_ES_RESPONSE = {
  data: {
    hits: {
      total: { value: 25 },
      hits: []
    },
    aggregations: {
      "sterms#index_counts": {
        buckets: [
          {
            key: "dina_material_sample_index",
            doc_count: 15,
            "top_hits#top_results": {
              hits: {
                hits: [
                  {
                    _index: "dina_material_sample_index",
                    _id: "sample-1",
                    _score: 10.5,
                    _source: {
                      data: {
                        id: "sample-1",
                        type: "material-sample",
                        attributes: {
                          materialSampleName: "Sample ABC"
                        }
                      }
                    },
                    highlight: {
                      "data.attributes.materialSampleName": [
                        "Sample <em>ABC</em>"
                      ]
                    }
                  },
                  {
                    _index: "dina_material_sample_index",
                    _id: "sample-2",
                    _score: 8.2,
                    _source: {
                      data: {
                        id: "sample-2",
                        type: "material-sample",
                        attributes: {
                          materialSampleName: "Sample XYZ"
                        }
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            key: "dina_agent_index",
            doc_count: 10,
            "top_hits#top_results": {
              hits: {
                hits: [
                  {
                    _index: "dina_agent_index",
                    _id: "person-1",
                    _score: 9.0,
                    _source: {
                      data: {
                        id: "person-1",
                        type: "person",
                        attributes: {
                          displayName: "John Doe"
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  }
};

/**
 * Mock response without type prefix on aggregation keys
 */
const MOCK_ES_RESPONSE_NO_PREFIX = {
  data: {
    aggregations: {
      index_counts: {
        buckets: [
          {
            key: "dina_material_sample_index",
            doc_count: 5,
            top_results: {
              hits: {
                hits: [
                  {
                    _index: "dina_material_sample_index",
                    _id: "sample-1",
                    _score: 5.0,
                    _source: {
                      data: {
                        id: "sample-1",
                        type: "material-sample",
                        attributes: { name: "Test" }
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  }
};

describe("useMultiIndexSearch hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue(MOCK_ES_RESPONSE);
  });

  it("Returns initial state with no search results when search term is empty", async () => {
    const { result } = renderHook(() => useMultiIndexSearch(), { wrapper });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.searchResult).toBeUndefined();
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("Uses initialSearchTerm from config", async () => {
    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "test query" }),
      { wrapper }
    );

    expect(result.current.searchTerm).toBe("test query");

    // Should trigger a search
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
  });

  it("Performs search when handleSearch is called with a non-empty term", async () => {
    const { result } = renderHook(() => useMultiIndexSearch(), { wrapper });

    // Initially no search
    expect(mockPost).not.toHaveBeenCalled();

    // Trigger search
    act(() => {
      result.current.handleSearch("ABC");
    });

    expect(result.current.searchTerm).toBe("ABC");

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    // Check API call
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining("search-api/search-ws/search?indexName="),
      expect.objectContaining({
        size: 0,
        query: {
          multi_match: {
            query: "ABC",
            fields: ["data.attributes.*"],
            lenient: true
          }
        },
        aggs: expect.objectContaining({
          index_counts: expect.any(Object)
        })
      })
    );
  });

  it("Processes search results correctly", async () => {
    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "test" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.searchResult).toBeDefined();
    });

    const searchResult = result.current.searchResult!;

    // Check total count
    expect(searchResult.totalCount).toBe(25);

    // Check index results
    expect(searchResult.indexResults).toHaveLength(2);
    expect(searchResult.indexResults[0].indexName).toBe(
      "dina_material_sample_index"
    );
    expect(searchResult.indexResults[0].count).toBe(15);
    expect(searchResult.indexResults[0].topHits).toHaveLength(2);

    expect(searchResult.indexResults[1].indexName).toBe("dina_agent_index");
    expect(searchResult.indexResults[1].count).toBe(10);
    expect(searchResult.indexResults[1].topHits).toHaveLength(1);

    // Check top matches are sorted by score
    expect(searchResult.topMatches).toHaveLength(3);
    expect(searchResult.topMatches[0]._score).toBe(10.5);
    expect(searchResult.topMatches[1]._score).toBe(9.0);
    expect(searchResult.topMatches[2]._score).toBe(8.2);
  });

  it("Handles aggregation keys without type prefix", async () => {
    mockPost.mockResolvedValue(MOCK_ES_RESPONSE_NO_PREFIX);

    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "test" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.searchResult).toBeDefined();
    });

    const searchResult = result.current.searchResult!;
    expect(searchResult.totalCount).toBe(5);
    expect(searchResult.indexResults).toHaveLength(1);
    expect(searchResult.indexResults[0].topHits).toHaveLength(1);
  });

  it("Does not perform search when search term is only whitespace", async () => {
    const { result } = renderHook(() => useMultiIndexSearch(), { wrapper });

    act(() => {
      result.current.handleSearch("   ");
    });

    // Wait a bit to ensure no API call is made
    await new Promise((r) => setTimeout(r, 100));

    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.searchResult).toBeUndefined();
  });

  it("Handles API errors gracefully", async () => {
    const mockError = new Error("Network error");
    mockPost.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "test" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.searchResult).toBeUndefined();
  });

  it("Updates search when search term changes", async () => {
    const { result } = renderHook(() => useMultiIndexSearch(), { wrapper });

    // First search
    act(() => {
      result.current.handleSearch("first");
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    // Second search
    act(() => {
      result.current.handleSearch("second");
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    // Check that the second search used the new term
    expect(mockPost).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        query: {
          multi_match: {
            query: "second",
            fields: ["data.attributes.*"],
            lenient: true
          }
        }
      })
    );
  });

  it("Returns pending state while search is in progress", async () => {
    // Make the API call hang
    mockPost.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(MOCK_ES_RESPONSE), 200)
        )
    );

    const { result } = renderHook(() => useMultiIndexSearch(), { wrapper });

    act(() => {
      result.current.handleSearch("test");
    });

    // Should be pending immediately after triggering search
    await waitFor(() => {
      expect(result.current.pending).toBe(true);
    });

    // Wait for search to complete
    await waitFor(
      () => {
        expect(result.current.pending).toBe(false);
      },
      { timeout: 500 }
    );

    expect(result.current.searchResult).toBeDefined();
  });

  it("Handles empty aggregation buckets", async () => {
    mockPost.mockResolvedValue({
      data: {
        aggregations: {
          "sterms#index_counts": {
            buckets: []
          }
        }
      }
    });

    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "nonexistent" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.searchResult).toBeDefined();
    });

    expect(result.current.searchResult!.totalCount).toBe(0);
    expect(result.current.searchResult!.indexResults).toHaveLength(0);
    expect(result.current.searchResult!.topMatches).toHaveLength(0);
  });

  it("Handles response with missing aggregations", async () => {
    mockPost.mockResolvedValue({
      data: {
        aggregations: {}
      }
    });

    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "test" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.searchResult).toBeDefined();
    });

    expect(result.current.searchResult!.totalCount).toBe(0);
    expect(result.current.searchResult!.indexResults).toHaveLength(0);
  });

  it("Includes all configured index names in the search URL", async () => {
    renderHook(() => useMultiIndexSearch({ initialSearchTerm: "test" }), {
      wrapper
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });

    const url = mockPost.mock.calls[0][0];
    expect(url).toContain("search-api/search-ws/search?indexName=");
    expect(url).toContain("dina_material_sample_index");
    expect(url).toContain("dina_object_store_index");
    expect(url).toContain("dina_storage_index");
    expect(url).toContain("dina_agent_index");
  });

  it("Preserves highlight information in search results", async () => {
    const { result } = renderHook(
      () => useMultiIndexSearch({ initialSearchTerm: "ABC" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.searchResult).toBeDefined();
    });

    const firstHit = result.current.searchResult!.indexResults[0].topHits[0];
    expect(firstHit.highlight).toBeDefined();
    expect(firstHit.highlight!["data.attributes.materialSampleName"]).toEqual([
      "Sample <em>ABC</em>"
    ]);
  });

  it("Clears results when search term becomes empty", async () => {
    const { result } = renderHook(() => useMultiIndexSearch(), { wrapper });

    // Start with a search
    act(() => {
      result.current.handleSearch("test");
    });

    await waitFor(() => {
      expect(result.current.searchResult).toBeDefined();
    });

    // Clear the search
    act(() => {
      result.current.handleSearch("");
    });

    // Results should be cleared (becomes undefined because query is null)
    await waitFor(() => {
      expect(result.current.searchResult).toBeUndefined();
    });
  });
});
