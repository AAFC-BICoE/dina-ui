import { KitsuResource } from "kitsu";
import { TableColumn } from "../../../types";
import {
  applyGroupFilters,
  applyPagination,
  applyRootQuery,
  applySortingRules,
  applySourceFiltering,
  includedTypeQuery,
  termQuery,
  existsQuery,
  rangeQuery,
  prefixQuery,
  infixQuery,
  suffixQuery,
  wildcardQuery,
  inQuery,
  inTextQuery,
  inRangeQuery,
  betweenQuery,
  inDateQuery,
  processResults
} from "../QueryBuilderElasticSearchExport";

const ELASTIC_SEARCH_QUERY: any = {
  query: {
    bool: {
      must: [
        {
          term: {
            "data.attributes.materialSampleName.keyword": "Test"
          }
        },
        {
          term: {
            "data.attributes.preparationDate": "2022-11-30"
          }
        }
      ]
    }
  }
};

const columnDefinitions: (TableColumn<KitsuResource> | string)[] = [
  {
    id: "testColumn1",
    label: "testColumn1",
    accessorKey: "data.attributes.testColumn1",
    isKeyword: true,
    additionalAccessors: [
      "data.attributes.includeThis1",
      "data.attributes.includeThis2"
    ]
  },
  {
    id: "testColumn2",
    label: "testColumn2",
    accessorKey: "data.attributes.testColumn2",
    isKeyword: false,
    additionalAccessors: ["data.attributes.includeThis3"]
  },
  "testColumn3",
  {
    id: "testColumn4",
    label: "testColumn4",
    accessorKey: "data.attributes.testColumn4",
    isKeyword: false,
    relationshipType: "relationshipType1"
  },
  {
    id: "testColumn5",
    label: "testColumn5",
    accessorKey: "data.attributes.testColumn5",
    isKeyword: true,
    relationshipType: "relationshipType2"
  },
  {
    label: "testColumn6",
    accessorKey: "data.attributes.testColumn6",
    isKeyword: true,
    relationshipType: "relationshipType2"
  }
];

describe("QueryBuilderElasticSearchExport functionality", () => {
  describe("applyPagination", () => {
    test("Pagination is correctly applied to query", async () => {
      // Pagination should be added to the existing query without altering anything.
      expect(applyPagination(ELASTIC_SEARCH_QUERY, 25, 0)).toMatchSnapshot();
      expect(applyPagination(ELASTIC_SEARCH_QUERY, 100, 100)).toMatchSnapshot();
    });
  });

  describe("applySortingRules", () => {
    test("Sorting on columns without id", async () => {
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "testColumn6", desc: true }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();
    });

    test("Basic sorting is correctly applied to the query", async () => {
      // Single Sorting rule, descending.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "testColumn1", desc: true }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Single Sorting rule, ascending.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "testColumn1", desc: false }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Multiple sorting rules.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [
            { id: "testColumn1", desc: false },
            { id: "testColumn2", desc: true }
          ],
          columnDefinitions as any
        )
      ).toMatchSnapshot();
    });

    test("Relationship sorting query generation", async () => {
      // Single Relationship Sorting rule, descending.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "testColumn4", desc: true }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Multiple Relationship Sorting rules.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [
            { id: "testColumn4", desc: true },
            { id: "testColumn5", desc: false }
          ],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Finally, a mix of normal and relationship sorting rules.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [
            { id: "testColumn1", desc: false },
            { id: "testColumn2", desc: true },
            { id: "testColumn4", desc: true },
            { id: "testColumn5", desc: false }
          ],
          columnDefinitions as any
        )
      ).toMatchSnapshot();
    });

    test("No sorting to be performed, leave query the same without adding anything.", async () => {
      // Single Sorting rule, descending.
      expect(
        applySortingRules(ELASTIC_SEARCH_QUERY, [], columnDefinitions as any)
      ).toMatchSnapshot();
    });

    test("Attempting to sort on a column that does not exist", async () => {
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "data.attributes.unknownColumn", desc: false }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();
    });

    test("Strings as column definitions", async () => {
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "testColumn3", desc: false }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();
    });
  });

  describe("applySourceFiltering", () => {
    test("Ensure all source filtering are being applied to the query", async () => {
      expect(
        applySourceFiltering(ELASTIC_SEARCH_QUERY, columnDefinitions as any)
      ).toMatchSnapshot();
    });
  });

  describe("applyGroupFilters", () => {
    test("Single group", async () => {
      expect(
        applyGroupFilters(ELASTIC_SEARCH_QUERY, ["aafc"])
      ).toMatchSnapshot();
    });

    test("Multiple groups", async () => {
      expect(
        applyGroupFilters(ELASTIC_SEARCH_QUERY, ["aafc", "cnc", "seqdb"])
      ).toMatchSnapshot();
    });

    test("No groups", async () => {
      expect(applyGroupFilters(ELASTIC_SEARCH_QUERY, [])).toMatchSnapshot();
    });
  });

  describe("applyRootQuery", () => {
    test("Boolean logic exists, move it properly to it's own boolean section.", async () => {
      expect(
        applyRootQuery(
          {
            bool: {
              must: [
                {
                  term: {
                    "data.attributes.materialSampleName.keyword": "Test"
                  }
                },
                {
                  term: {
                    "data.attributes.preparationDate": "2022-11-30"
                  }
                }
              ]
            }
          },
          undefined
        )
      ).toMatchSnapshot();
    });

    test("Boolean logic exists, also contains should logic, include the must match minimum.", async () => {
      expect(
        applyRootQuery(
          {
            bool: {
              should: [
                {
                  term: {
                    "data.attributes.materialSampleName.keyword": "Test"
                  }
                },
                {
                  term: {
                    "data.attributes.preparationDate": "2022-11-30"
                  }
                }
              ],
              must: [
                {
                  term: {
                    "data.attributes.materialSampleName.keyword": "Test"
                  }
                },
                {
                  term: {
                    "data.attributes.preparationDate": "2022-11-30"
                  }
                }
              ]
            }
          },
          undefined
        )
      ).toMatchSnapshot();
    });

    test("No boolean logic exists, just return the query as is.", async () => {
      expect(applyRootQuery({ query: {} }, undefined)).toMatchSnapshot();
    });

    test("When customQuery is being applied, ensure it's being merged with the other one", async () => {
      expect(
        applyRootQuery(
          {
            bool: {
              must: [
                {
                  term: {
                    "data.attributes.materialSampleName.keyword": "Test"
                  }
                },
                {
                  term: {
                    "data.attributes.preparationDate": "2022-11-30"
                  }
                }
              ]
            }
          },
          {
            bool: {
              must_not: {
                term: {
                  "data.id": "57768f57-047c-47cf-af1b-fb1e0e1861d4"
                }
              }
            }
          }
        )
      ).toMatchSnapshot();
    });
  });

  describe("processResults", () => {
    test("Entity attributes only", async () => {
      const result = {
        total: { relation: "eq", value: 25 },
        hits: [
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: {},
                  projects: { data: [] },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: { data: null },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "CULTURE_STRAIN",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "sample10-B",
                  createdOn: "2024-08-29T14:25:55.864404Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01919e87-58ef-7712-b32f-4ae08321e7e3",
                type: "material-sample"
              }
            }
          },
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: {},
                  projects: { data: [] },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: { data: null },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "CULTURE_STRAIN",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "sample10-C",
                  createdOn: "2024-08-29T14:25:55.864404Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01919e87-59a3-7c07-a4b9-a10f4ddd4a80",
                type: "material-sample"
              }
            }
          },
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: {},
                  projects: { data: [] },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: { data: null },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "CULTURE_STRAIN",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "sample10-D",
                  createdOn: "2024-08-29T14:25:55.864404Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01919e87-5a16-7653-83db-530af5cb4b7d",
                type: "material-sample"
              }
            }
          }
        ]
      };

      expect(processResults(result)).toMatchSnapshot();
    });

    test("Relationships", async () => {
      const result = {
        total: { relation: "eq", value: 25 },
        hits: [
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: {},
                  projects: { data: [] },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: { data: null },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "CULTURE_STRAIN",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "sample10-J",
                  createdOn: "2024-08-29T14:25:55.864404Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01919e87-5b71-7dff-921b-16c1ed4f011a",
                type: "material-sample"
              }
            }
          },
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: {},
                  projects: { data: [] },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: {
                    data: {
                      id: "2b349356-3ffb-46be-81f5-cb0d6ae9b4ef",
                      type: "collection"
                    },
                    links: {
                      related:
                        "/api/v1/material-sample/01919e87-58a0-70bd-8846-453100ccecb9/collection",
                      self: "/api/v1/material-sample/01919e87-58a0-70bd-8846-453100ccecb9/relationships/collection"
                    }
                  },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "CULTURE_STRAIN",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "sample10-A",
                  createdOn: "2024-08-29T14:25:55.864404Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01919e87-58a0-70bd-8846-453100ccecb9",
                type: "material-sample"
              },
              included: [
                {
                  attributes: {
                    code: "SeqDB",
                    name: "Sequence Database"
                  },
                  id: "2b349356-3ffb-46be-81f5-cb0d6ae9b4ef",
                  type: "collection"
                }
              ]
            }
          },
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: {},
                  projects: { data: [] },
                  preparedBy: { data: [] },
                  organism: {
                    data: [
                      {
                        id: "6f8908fd-64c7-4524-8375-965d5c4573a4",
                        type: "organism"
                      }
                    ],
                    links: {
                      related:
                        "/api/v1/material-sample/0192da0b-b7b2-7840-a902-a5d26ee7edea/organism",
                      self: "/api/v1/material-sample/0192da0b-b7b2-7840-a902-a5d26ee7edea/relationships/organism"
                    }
                  },
                  attachment: { data: [] },
                  collection: {
                    data: {
                      id: "01919f58-a9ea-7838-9737-7a0e54cdc41b",
                      type: "collection"
                    },
                    links: {
                      related:
                        "/api/v1/material-sample/01919e87-59a3-7c07-a4b9-a10f4ddd4a80/collection",
                      self: "/api/v1/material-sample/01919e87-59a3-7c07-a4b9-a10f4ddd4a80/relationships/collection"
                    }
                  },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "CULTURE_STRAIN",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "sample10-C",
                  createdOn: "2024-08-29T14:25:55.864404Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01919e87-59a3-7c07-a4b9-a10f4ddd4a80",
                type: "material-sample"
              },
              included: [
                {
                  attributes: {
                    code: "CNC",
                    name: "Canadian National Collection"
                  },
                  id: "01919f58-a9ea-7838-9737-7a0e54cdc41b",
                  type: "collection"
                }
              ]
            }
          }
        ]
      };

      expect(processResults(result)).toMatchSnapshot();
    });

    test("To-many relationships", async () => {
      const result = {
        total: { relation: "eq", value: 2 },
        hits: [
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: { data: null },
                  projects: {
                    data: [
                      {
                        id: "01919485-ed65-7a79-9080-91445b897ef4",
                        type: "project"
                      }
                    ],
                    links: {
                      related:
                        "/api/v1/material-sample/01918f22-13a4-7f6d-894e-974bc1e14d23/projects",
                      self: "/api/v1/material-sample/01918f22-13a4-7f6d-894e-974bc1e14d23/relationships/projects"
                    }
                  },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: { data: null },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "WHOLE_ORGANISM",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "SAMPLE_a",
                  createdOn: "2024-08-26T14:41:00.656734Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01918f22-13a4-7f6d-894e-974bc1e14d23",
                type: "material-sample"
              },
              included: [
                {
                  attributes: {
                    name: "Project A"
                  },
                  id: "01919485-ed65-7a79-9080-91445b897ef4",
                  type: "project"
                }
              ]
            }
          },
          {
            _source: {
              data: {
                relationships: {
                  parentMaterialSample: {},
                  collectingEvent: { data: null },
                  preparationMethod: { data: null },
                  storageUnitUsage: { data: null },
                  projects: {
                    data: [
                      {
                        id: "01919485-ed65-7a79-9080-91445b897ef4",
                        type: "project"
                      },
                      {
                        id: "01919486-2f9a-7d1c-92f3-05a2542e2eea",
                        type: "project"
                      }
                    ],
                    links: {
                      related:
                        "/api/v1/material-sample/01918f22-1687-7634-bcd3-cd56d493bf27/projects",
                      self: "/api/v1/material-sample/01918f22-1687-7634-bcd3-cd56d493bf27/relationships/projects"
                    }
                  },
                  preparedBy: { data: [] },
                  organism: { data: [] },
                  attachment: { data: [] },
                  collection: { data: null },
                  preparationProtocol: {},
                  preparationType: { data: null },
                  assemblages: { data: [] }
                },
                attributes: {
                  materialSampleType: "WHOLE_ORGANISM",
                  dwcOtherCatalogNumbers: null,
                  createdBy: "dina-admin",
                  materialSampleName: "SAMPLE_c",
                  createdOn: "2024-08-26T14:41:00.656734Z",
                  materialSampleState: null,
                  group: "aafc"
                },
                id: "01918f22-1687-7634-bcd3-cd56d493bf27",
                type: "material-sample"
              },
              included: [
                {
                  attributes: {
                    name: "Project A"
                  },
                  id: "01919485-ed65-7a79-9080-91445b897ef4",
                  type: "project"
                },
                {
                  attributes: {
                    name: "Project B"
                  },
                  id: "01919486-2f9a-7d1c-92f3-05a2542e2eea",
                  type: "project"
                }
              ]
            }
          }
        ]
      };

      expect(processResults(result)).toMatchSnapshot();
    });
  });

  describe("Query helper functions", () => {
    test("includedTypeQuery", async () => {
      expect(includedTypeQuery("parentTest")).toMatchSnapshot();
    });

    test("termQuery", async () => {
      expect(termQuery("fieldTest", "valueToMatch", true)).toMatchSnapshot();
      expect(termQuery("fieldTest", "valueToMatch", false)).toMatchSnapshot();
    });

    test("wildcard", async () => {
      expect(
        wildcardQuery("fieldTest", "valueToMatch", false)
      ).toMatchSnapshot();
      expect(
        wildcardQuery("fieldTest", "valueToMatch", true)
      ).toMatchSnapshot();
    });

    test("inQuery", async () => {
      // Test keyword support
      expect(
        inQuery("fieldTest", "test1, test2, TEST3", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inQuery("fieldTest", "test1, test2, TEST3", undefined, false, false)
      ).toMatchSnapshot();

      // Not version
      expect(
        inQuery("fieldTest", "test1, test2", undefined, true, true)
      ).toMatchSnapshot();

      // Comma-separator tests.
      expect(
        inQuery("fieldTest", "test1,test2,test3", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inQuery("fieldTest", "  test1, test2, test3  ", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inQuery("fieldTest", " TEST1 ", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inQuery("fieldTest", "", undefined, true, false)
      ).toMatchSnapshot();

      // Empty last comma should be ignored.
      expect(
        inQuery("fieldTest", "test1, test2, ", undefined, true, false)
      ).toMatchSnapshot();
    });

    test("inTextQuery", async () => {
      // Test keyword support
      expect(
        inTextQuery("fieldTest", "test1, test2, TEST3", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inTextQuery("fieldTest", "test1, test2, TEST3", undefined, false, false)
      ).toMatchSnapshot();

      // Not version
      expect(
        inTextQuery("fieldTest", "test1, test2", undefined, true, true)
      ).toMatchSnapshot();

      // Comma-separator tests.
      expect(
        inTextQuery("fieldTest", "test1,test2,test3", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inTextQuery(
          "fieldTest",
          "  test1, test2, test3  ",
          undefined,
          true,
          false
        )
      ).toMatchSnapshot();
      expect(
        inTextQuery("fieldTest", " TEST1 ", undefined, true, false)
      ).toMatchSnapshot();
      expect(
        inTextQuery("fieldTest", "", undefined, true, false)
      ).toMatchSnapshot();

      // Empty last comma should be ignored.
      expect(
        inTextQuery("fieldTest", "test1, test2, ", undefined, true, false)
      ).toMatchSnapshot();
    });

    test("inDateQuery", async () => {
      // In version
      expect(
        inDateQuery(
          "fieldTest",
          "1998-05-19, 2005-09-23, 2023-01-01",
          undefined,
          "date_time",
          false
        )
      ).toMatchSnapshot();
      expect(
        inDateQuery(
          "fieldTest",
          "1998-05-19, 2005-09-23, 2023-01-01",
          undefined,
          "date_time",
          false
        )
      ).toMatchSnapshot();

      // Not in version
      expect(
        inDateQuery(
          "fieldTest",
          "1998-05-19, 2005-09-23",
          undefined,
          "date_time",
          true
        )
      ).toMatchSnapshot();

      // Comma-separator tests.
      expect(
        inDateQuery(
          "fieldTest",
          "1998-05-19,2005-09-23,2023-01-01",
          undefined,
          "date_time",
          false
        )
      ).toMatchSnapshot();
      expect(
        inDateQuery(
          "fieldTest",
          "  1998-05-19, 2005-09-23, 2023-01-01  ",
          undefined,
          "date_time",
          false
        )
      ).toMatchSnapshot();
      expect(
        inDateQuery("fieldTest", " 1998-05-19 ", undefined, "date_time", false)
      ).toMatchSnapshot();
      expect(
        inDateQuery("fieldTest", "", undefined, "date_time", false)
      ).toMatchSnapshot();

      // Empty last comma should be ignored.
      expect(
        inDateQuery(
          "fieldTest",
          "1998-05-19, 2005-09-23, ",
          undefined,
          "date_time",
          false
        )
      ).toMatchSnapshot();
    });

    test("inRangeQuery", async () => {
      expect(
        inRangeQuery("fieldTest", "1998-05-19, 2023-03-02", undefined, false)
      ).toMatchSnapshot();
    });

    test("existsQuery", async () => {
      expect(existsQuery("fieldTest")).toMatchSnapshot();
    });

    test("rangeQuery", async () => {
      expect(rangeQuery("fieldTest", { lt: 500 })).toMatchSnapshot();
    });

    test("betweenQuery tests", async () => {
      expect(
        betweenQuery(
          "data.attribute.numberExample",
          JSON.stringify({ low: 2, high: 5 }),
          undefined,
          "number"
        )
      ).toMatchSnapshot();
      expect(
        betweenQuery(
          "data.attribute.materialSampleName",
          JSON.stringify({ low: "Test100", high: "Test200" }),
          undefined,
          "text"
        )
      ).toMatchSnapshot();
      expect(
        betweenQuery(
          "included.attributes.dwcRecordNumber",
          JSON.stringify({ low: "10.5", high: "293" }),
          "collecting-event",
          "number"
        )
      ).toMatchSnapshot();
    });
  });

  describe("Partial matching query helper functions", () => {
    test("prefixQuery attribute (not optimized)", async () => {
      expect(
        prefixQuery(
          "data.attribute.materialSampleName",
          "searchValue",
          undefined,
          false,
          false
        )
      ).toMatchSnapshot();
    });

    test("prefixQuery relationship (not optimized)", async () => {
      expect(
        prefixQuery(
          "included.attributes.dwcRecordNumber",
          "searchValue",
          "collecting-event",
          false,
          false
        )
      ).toMatchSnapshot();
    });

    test("prefixQuery attribute (not optimized, keyword support)", async () => {
      expect(
        prefixQuery(
          "data.attribute.materialSampleName",
          "searchValue",
          undefined,
          false,
          true
        )
      ).toMatchSnapshot();
    });

    test("prefixQuery relationship (not optimized, keyword support)", async () => {
      expect(
        prefixQuery(
          "included.attributes.dwcRecordNumber",
          "searchValue",
          "collecting-event",
          false,
          true
        )
      ).toMatchSnapshot();
    });

    test("prefixQuery attribute (optimized)", async () => {
      expect(
        prefixQuery(
          "data.attribute.materialSampleName",
          "searchValue",
          undefined,
          true,
          false
        )
      ).toMatchSnapshot();
    });

    test("prefixQuery relationship (optimized)", async () => {
      expect(
        prefixQuery(
          "included.attributes.dwcRecordNumber",
          "searchValue",
          "collecting-event",
          true,
          false
        )
      ).toMatchSnapshot();
    });

    test("infixQuery attribute", async () => {
      expect(
        infixQuery(
          "data.attribute.materialSampleName",
          "searchValue",
          undefined
        )
      ).toMatchSnapshot();
    });

    test("infixQuery relationship", async () => {
      expect(
        infixQuery(
          "included.attributes.dwcRecordNumber",
          "searchValue",
          "collecting-event"
        )
      ).toMatchSnapshot();
    });

    test("suffixQuery attribute", async () => {
      expect(
        suffixQuery(
          "data.attribute.materialSampleName",
          "searchValue",
          undefined
        )
      ).toMatchSnapshot();
    });

    test("suffixQuery relationship", async () => {
      expect(
        suffixQuery(
          "included.attributes.dwcRecordNumber",
          "searchValue",
          "collecting-event"
        )
      ).toMatchSnapshot();
    });

    test("Empty values are left as empty queries", async () => {
      expect(
        prefixQuery(
          "data.attribute.materialSampleName",
          "",
          undefined,
          true,
          false
        )
      ).toStrictEqual({});
      expect(
        infixQuery("data.attribute.materialSampleName", "", undefined)
      ).toStrictEqual({});
      expect(
        suffixQuery("data.attribute.materialSampleName", "", undefined)
      ).toStrictEqual({});
    });
  });
});
