// CollectionLinkedProjectsTable.test.js
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
    apiContext.apiClient.axios.post.mockImplementation(
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

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
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

    // Makes request for mapping
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("search-api/search-ws/mapping", {
        params: { indexName: "dina_project_index" }
      });
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenNthCalledWith(
        2,
        "search-api/search-ws/search",
        expect.any(Object),
        { params: { indexName: "dina_project_index" } }
      );
    });
  });
});
