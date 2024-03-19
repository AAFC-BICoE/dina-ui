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
  betweenQuery
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
        applyRootQuery({
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
        })
      ).toMatchSnapshot();
    });

    test("Boolean logic exists, also contains should logic, include the must match minimum.", async () => {
      expect(
        applyRootQuery({
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
        })
      ).toMatchSnapshot();
    });

    test("No boolean logic exists, just return the query as is.", async () => {
      expect(applyRootQuery({ query: {} })).toMatchSnapshot();
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
      expect(inQuery("fieldTest", "test1, test2, TEST3", undefined, true, false)).toMatchSnapshot();
      expect(inQuery("fieldTest", "test1, test2, TEST3", undefined, false, false)).toMatchSnapshot();

      // Not version
      expect(inQuery("fieldTest", "test1, test2", undefined, true, true)).toMatchSnapshot();

      // Comma-separator tests. 
      expect(inQuery("fieldTest", "test1,test2,test3", undefined, true, false)).toMatchSnapshot();
      expect(inQuery("fieldTest", "  test1, test2, test3  ", undefined, true, false)).toMatchSnapshot();
      expect(inQuery("fieldTest", " TEST1 ", undefined, true, false)).toMatchSnapshot();
      expect(inQuery("fieldTest", "", undefined, true, false)).toMatchSnapshot();
    });

    test("inTextQuery", async () => {
      // Test keyword support
      expect(inTextQuery("fieldTest", "test1, test2, TEST3", undefined, true, false)).toMatchSnapshot();
      expect(inTextQuery("fieldTest", "test1, test2, TEST3", undefined, false, false)).toMatchSnapshot();

      // Not version
      expect(inTextQuery("fieldTest", "test1, test2", undefined, true, true)).toMatchSnapshot();

      // Comma-separator tests. 
      expect(inTextQuery("fieldTest", "test1,test2,test3", undefined, true, false)).toMatchSnapshot();
      expect(inTextQuery("fieldTest", "  test1, test2, test3  ", undefined, true, false)).toMatchSnapshot();
      expect(inTextQuery("fieldTest", " TEST1 ", undefined, true, false)).toMatchSnapshot();
      expect(inTextQuery("fieldTest", "", undefined, true, false)).toMatchSnapshot();
    });

    test("inRangeQuery", async () => {
      expect(inRangeQuery("fieldTest", "1998-05-19, 2023-03-02", undefined, false)).toMatchSnapshot();
    });

    test("existsQuery", async () => {
      expect(existsQuery("fieldTest")).toMatchSnapshot();
    });

    test("rangeQuery", async () => {
      expect(rangeQuery("fieldTest", { lt: 500 })).toMatchSnapshot();
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

    test("betweenQuery tests", async () => {
      expect(betweenQuery("data.attribute.materialSampleName", JSON.stringify({ low: 2, high: 5 }), undefined, "number")).toMatchSnapshot();
      expect(betweenQuery("data.attribute.materialSampleName", JSON.stringify({ low: "Test100", high: "Test200" }), undefined, "text")).toMatchSnapshot();
      expect(betweenQuery("included.attributes.dwcRecordNumber", JSON.stringify({ low: "10.5", high: "293" }), "collecting-event", "number")).toMatchSnapshot();
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
