import { MATERIAL_SAMPLE_MAPPING } from "./IndexMappingMocks";

// Mock responses for QueryPage tests
export const mockResponses = {
  "user-api/group": {
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
  },
  "search-api/search-ws/mapping": MATERIAL_SAMPLE_MAPPING.data,
  "search-api/search-ws/search": {
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
                  group: "cnc-su",
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
                  group: "cnc-su",
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
  },
  "/material-sample/074e745e-7ef1-449c-965a-9a4dc754391f?include=storageUnitUsage":
    {
      id: "074e745e-7ef1-449c-965a-9a4dc754391f",
      type: "material-sample",
      attributes: {
        materialSampleName: "Sample 1",
        group: "cnc-su",
        createdBy: "cnc-su",
        createdOn: "2023-12-14T18:48:13.080841Z"
      }
    },
  "/material-sample/7c2b6795-02bb-4edd-97af-589527ef3e7f?include=storageUnitUsage":
    {
      id: "7c2b6795-02bb-4edd-97af-589527ef3e7f",
      type: "material-sample",
      group: "cnc-su",
      materialSampleName: "Sample 2",
      createdBy: "cnc-su",
      createdOn: "2023-12-09T16:53:14.363355Z",
      storageUnitUsage: {
        wellColumn: 1,
        wellRow: "A",
        storageUnitName: "Freezer 1",
        usageType: "material-sample",
        createdBy: "cnc-su",
        createdOn: "2023-12-14T18:50:00.000000Z",
        id: "01919485-ed65-7a79-9080-91445b897ef4",
        type: "storage-unit-usage"
      }
    }
};

export const mockResponsesTabs = {
  "search-api/search-ws/search": {
    data: {
      hits: {
        total: { value: 2 },
        hits: [
          {
            _id: "test-1",
            _source: {
              id: "test-1",
              type: "test-resource",
              name: "Resource 1"
            }
          },
          {
            _id: "test-2",
            _source: {
              id: "test-2",
              type: "test-resource",
              name: "Resource 2"
            }
          }
        ]
      }
    }
  }
};
