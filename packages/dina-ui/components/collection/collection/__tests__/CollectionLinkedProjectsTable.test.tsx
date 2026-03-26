import { waitFor } from "@testing-library/react";
import { CollectionLinkedProjectsTable } from "../CollectionLinkedProjectsTable";
import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";
import {
  mockPost,
  mockGet
} from "../__mocks__/CollectionLinkedProjectsTableMocks";

const apiContext: any = {
  apiClient: {
    axios: {
      post: mockPost,
      get: mockGet
    }
  }
};
describe("CollectionLinkedProjectsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state initially", async () => {
    apiContext.apiClient.axios.post.mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    const wrapper = mountWithAppContext(
      <CollectionLinkedProjectsTable id="collection-123" />,
      {
        apiContext: apiContext
      }
    );
    await waitFor(() => {
      expect(wrapper.queryByText(/Loading\.\.\./i)).toBeInTheDocument();
    });
  });

  it("should make the correct queries to display linked projects", async () => {
    mountWithAppContext(<CollectionLinkedProjectsTable id="collection-123" />, {
      apiContext: apiContext
    });

    // initial call to find all material samples linked to this collection and their project IDs
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "search-api/search-ws/search",
        {
          size: 0,
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
          },
          aggs: {
            unique_projects: {
              terms: {
                field: "data.relationships.projects.data.id",
                size: 10000
              }
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );
    });

    // Makes request for field mappings
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("search-api/search-ws/mapping", {
        params: { indexName: "dina_project_index" }
      });
    });

    // request for project details using the extracted project ID from the first query
    await waitFor(() => {
      expect(mockPost).toHaveBeenNthCalledWith(
        2,
        "search-api/search-ws/search",
        expect.any(Object),
        { params: { indexName: "dina_project_index" } }
      );
    });
  });

  it("should not display duplicate projects if they linked to by multiple samples", async () => {
    mountWithAppContext(
      <CollectionLinkedProjectsTable id="collection-multiple-samples" />,
      {
        apiContext: apiContext
      }
    );

    // sample retrival for this collection returns 2 samples that both link to the same project ID "019cb00e-a656-734f-8b7c-96f0f4bfa807"
    // query should only look for 1 project
    await waitFor(() => {
      expect(mockPost).toHaveBeenNthCalledWith(
        2,
        "search-api/search-ws/search",
        expect.objectContaining({
          query: {
            terms: { "data.id": ["019cb00e-a656-734f-8b7c-96f0f4bfa807"] }
          }
        }),
        { params: { indexName: "dina_project_index" } }
      );
    });
  });

  it("should display the linked projects", async () => {
    const wrapper = mountWithAppContext(
      <CollectionLinkedProjectsTable id="collection-123" />,
      {
        apiContext: apiContext
      }
    );

    await waitFor(() => {
      // name
      expect(
        wrapper.getByRole("cell", {
          name: /bal/i
        })
      ).toBeInTheDocument();
      // createdBy
      expect(
        wrapper.getByRole("cell", {
          name: /dina-admin/i
        })
      ).toBeInTheDocument();
      // created on
      expect(
        wrapper.getByRole("cell", {
          name: /2026\-03\-04, 7:37:56 p\.m\./i
        })
      ).toBeInTheDocument();
      // startDate
      expect(
        wrapper.getByRole("cell", {
          name: /2026\-03\-02, 7:37:56 p\.m\./i
        })
      ).toBeInTheDocument();
      // endDate
      expect(
        wrapper.getByRole("cell", {
          name: /2026\-07\-02, 7:37:56 p\.m\./i
        })
      ).toBeInTheDocument();
      // group
      expect(
        wrapper.getByRole("cell", {
          name: /aafc/i
        })
      ).toBeInTheDocument();
      // status
      expect(
        wrapper.getByRole("cell", {
          name: /ongoing/i
        })
      ).toBeInTheDocument();
    });
  });

  it("should display an error when there is an error retriving samples", async () => {
    const wrapper = mountWithAppContext(
      <CollectionLinkedProjectsTable id="collection-error" />,
      {
        apiContext: apiContext
      }
    );

    await waitFor(() => {
      expect(
        wrapper.getByText(
          /failed to load linked projects: error retriving samples/i
        )
      ).toBeInTheDocument();
    });
  });

  it("should display an error when there is an error retriving projects", async () => {
    const wrapper = mountWithAppContext(
      <CollectionLinkedProjectsTable id="collection-project-error" />,
      {
        apiContext: apiContext
      }
    );

    await waitFor(() => {
      expect(
        wrapper.getByText(/error: error retriving projects/i)
      ).toBeInTheDocument();
    });
  });
});
