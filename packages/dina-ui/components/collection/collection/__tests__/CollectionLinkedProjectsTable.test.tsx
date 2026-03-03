// CollectionLinkedProjectsTable.test.js
import { screen, waitFor } from "@testing-library/react";
import CollectionLinkedProjectsTable from "../CollectionLinkedProjectsTable";
import { mountWithAppContext } from "common-ui";

describe("CollectionLinkedProjectsTable", () => {
  const mockApiClient: any = {
    axios: {
      post: jest.fn()
    }
  };

  const mockApiContext = {
    apiClient: mockApiClient
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state initially", () => {
    mockApiClient.axios.post.mockImplementation(() => new Promise(() => {}));

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("should fetch material samples with correct query", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: []
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(mockApiClient.axios.post).toHaveBeenCalledWith(
        "search-api/search-ws/search",
        {
          _source: { includes: ["data.relationships"] },
          query: {
            bool: {
              must: [
                {
                  term: {
                    "data.relationships.collection.data.id": "collection-123"
                  }
                }
              ]
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );
    });
  });

  it("should extract project IDs from material samples", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [
            {
              _source: {
                data: {
                  relationships: {
                    projects: {
                      data: [{ id: "project-1" }, { id: "project-2" }]
                    }
                  }
                }
              }
            },
            {
              _source: {
                data: {
                  relationships: {
                    projects: {
                      data: [{ id: "project-2" }, { id: "project-3" }]
                    }
                  }
                }
              }
            }
          ]
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(screen.getByTestId("query-page")).toBeInTheDocument();
    });

    const querySearch = screen.getByTestId("query-search");
    const searchQuery = JSON.parse(querySearch.textContent);

    // Should deduplicate project IDs
    expect(searchQuery.query.terms["data.id"]).toEqual(
      expect.arrayContaining(["project-1", "project-2", "project-3"])
    );
    expect(searchQuery.query.terms["data.id"]).toHaveLength(3);
  });

  it("should handle empty project results gracefully", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: []
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(screen.getByTestId("query-page")).toBeInTheDocument();
    });

    const querySearch = screen.getByTestId("query-search");
    const searchQuery = JSON.parse(querySearch.textContent);

    expect(searchQuery.query.terms["data.id"]).toEqual([]);
  });

  it("should handle samples with missing project relationships", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [
            {
              _source: {
                data: {
                  relationships: {
                    projects: {
                      data: [{ id: "project-1" }]
                    }
                  }
                }
              }
            },
            {
              _source: {
                data: {
                  relationships: {} // No projects
                }
              }
            },
            {
              _source: {
                data: {} // No relationships
              }
            }
          ]
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(screen.getByTestId("query-page")).toBeInTheDocument();
    });

    const querySearch = screen.getByTestId("query-search");
    const searchQuery = JSON.parse(querySearch.textContent);

    expect(searchQuery.query.terms["data.id"]).toEqual(["project-1"]);
  });

  it("should display error message on API failure", async () => {
    const error = new Error("Network error");
    mockApiClient.axios.post.mockRejectedValueOnce(error);

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load linked projects: Network error")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to load linked projects: Network error")
    ).toHaveClass("alert alert-danger");
  });

  it("should pass correct props to QueryPage component", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [
            {
              _source: {
                data: {
                  relationships: {
                    projects: {
                      data: [{ id: "project-1" }]
                    }
                  }
                }
              }
            }
          ]
        }
      }
    });

    const { QueryPage } = require("common-ui");

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(QueryPage).toHaveBeenCalledWith(
        expect.objectContaining({
          indexName: "dina_project_index",
          uniqueName: "relatedProjects",
          viewMode: true,
          customViewFilterGroups: false,
          enableColumnSelector: false,
          customViewElasticSearchQuery: {
            query: {
              terms: { "data.id": ["project-1"] }
            }
          },
          customViewFields: [
            {
              fieldName: "data.id",
              type: "uuid"
            }
          ]
        }),
        {}
      );
    });
  });

  it("should not fetch data if id is not provided", async () => {
    mountWithAppContext(<CollectionLinkedProjectsTable id="" />, {
      apiContext: mockApiContext
    });

    // Wait a bit to ensure no API call happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockApiClient.axios.post).not.toHaveBeenCalled();
  });

  it("should render table columns with correct configuration", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: []
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(screen.getByTestId("query-columns")).toHaveTextContent("8");
    });
  });

  it("should render collection title message", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: []
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(
        screen.getByText("collectionLinkedProjectTableTitle")
      ).toBeInTheDocument();
    });
  });

  it("should deduplicates project IDs from multiple samples", async () => {
    mockApiClient.axios.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [
            {
              _source: {
                data: {
                  relationships: {
                    projects: {
                      data: [
                        { id: "project-1" },
                        { id: "project-1" },
                        { id: "project-2" }
                      ]
                    }
                  }
                }
              }
            },
            {
              _source: {
                data: {
                  relationships: {
                    projects: {
                      data: [{ id: "project-1" }, { id: "project-2" }]
                    }
                  }
                }
              }
            }
          ]
        }
      }
    });

    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: mockApiContext
    });

    await waitFor(() => {
      expect(screen.getByTestId("query-page")).toBeInTheDocument();
    });

    const querySearch = screen.getByTestId("query-search");
    const searchQuery = JSON.parse(querySearch.textContent);

    // Should only have 2 unique project IDs
    expect(searchQuery.query.terms["data.id"]).toHaveLength(2);
    expect(searchQuery.query.terms["data.id"]).toEqual(
      expect.arrayContaining(["project-1", "project-2"])
    );
  });
});
