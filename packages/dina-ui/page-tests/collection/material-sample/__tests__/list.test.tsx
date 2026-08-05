import "@testing-library/jest-dom";
import MaterialSampleListPage from "../../../../pages/collection/material-sample/list";
import { MATERIAL_SAMPLE_MAPPING, mountWithAppContext } from "common-ui";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return {
        data: [
          {
            id: "2b4549e9-9a95-489f-8e30-74c2d877d8a8",
            type: "group",
            name: "cnc",
            labels: { en: "CNC" }
          }
        ],
        links: {
          first: "/api/v1/group?page[limit]=1000&filter[name]=cnc",
          last: "/api/v1/group?page[limit]=1000&filter[name]=cnc"
        },
        meta: { totalResourceCount: 1, moduleVersion: "0.16" }
      };
    case "search-api/search-ws/mapping":
      return MATERIAL_SAMPLE_MAPPING;
    default:
      return { data: [] };
  }
});

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return {
        data: {
          took: 9,
          timed_out: false,
          _shards: { failed: 0.0, successful: 1.0, total: 1.0, skipped: 0.0 },
          hits: {
            total: { relation: "eq", value: 2 },
            hits: [
              {
                _index: "dina_material_sample_index",
                _id: "074e745e-7ef1-449c-965a-9a4dc754391f",
                _type: "_doc",
                _source: {
                  data: {
                    attributes: {
                      materialSampleType: null,
                      dwcOtherCatalogNumbers: null,
                      createdBy: "cnc-su",
                      materialSampleName: "Sample 1",
                      createdOn: "2023-12-14T18:48:13.080841Z",
                      materialSampleState: null
                    },
                    id: "074e745e-7ef1-449c-965a-9a4dc754391f",
                    type: "material-sample"
                  }
                },
                sort: [1702579693080]
              },
              {
                _index: "dina_material_sample_index",
                _id: "7c2b6795-02bb-4edd-97af-589527ef3e7f",
                _type: "_doc",
                _source: {
                  data: {
                    attributes: {
                      materialSampleType: null,
                      dwcOtherCatalogNumbers: null,
                      createdBy: "cnc-su",
                      materialSampleName: "Sample 2",
                      createdOn: "2023-12-09T16:53:14.363355Z",
                      materialSampleState: "decommissioned"
                    },
                    id: "7c2b6795-02bb-4edd-97af-589527ef3e7f",
                    type: "material-sample"
                  },
                  included: [
                    {
                      attributes: { name: "Collection 1" },
                      id: "25a1b789-a315-4ac2-8cbf-415dacf2f0de",
                      type: "collection"
                    },
                    {
                      id: "492c8679-fc1f-44f1-8839-69f8e6fdd79a",
                      type: "metadata"
                    }
                  ]
                },
                sort: [1702140794363]
              }
            ]
          }
        }
      };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        post: mockPost,
        get: mockGet
      }
    },
    bulkGet: jest.fn()
  }
} as any;

describe("Material Sample List Page", () => {
  it("Render the material-sample list page", async () => {
    const component = mountWithAppContext(<MaterialSampleListPage />, testCtx);
    expect(await component.findByTestId("ReactTable")).toBeInTheDocument();

    const reactTable = await component.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();
    expect(reactTable.querySelectorAll("table tbody tr").length).toBe(2);
    expect(
      reactTable.querySelectorAll("table tbody tr")[0].getAttribute("style")
    ).toBeNull();
  });
});
