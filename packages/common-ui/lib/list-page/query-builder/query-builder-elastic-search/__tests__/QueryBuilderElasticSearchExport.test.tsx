import { KitsuResource } from "kitsu";
import { TableColumn } from "../../../types";
import {
  applyGroupFilters,
  applyPagination,
  applySortingRules,
  applySourceFiltering
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
    label: "testColumn1",
    accessor: "data.attributes.testColumn1",
    isKeyword: true,
    additionalAccessors: [
      "data.attributes.includeThis1",
      "data.attributes.includeThis2"
    ]
  },
  {
    label: "testColumn2",
    accessor: "data.attributes.testColumn2",
    isKeyword: false,
    additionalAccessors: ["data.attributes.includeThis3"]
  },
  "testColumn3",
  {
    label: "testColumn4",
    accessor: "data.attributes.testColumn4",
    isKeyword: false,
    relationshipType: "relationshipType1"
  },
  {
    label: "testColumn5",
    accessor: "data.attributes.testColumn5",
    isKeyword: true,
    relationshipType: "relationshipType2"
  }
];

describe("QueryBuilderElasticSearchExport functionality", () => {
  // describe("elasticSearchFormatExport", () => {
  //   test("AND conjunction", async () => {

  //   });
  // });

  describe("applyPagination", () => {
    test("Pagination is correctly applied to query", async () => {
      // Pagination should be added to the existing query without altering anything.
      expect(applyPagination(ELASTIC_SEARCH_QUERY, 25, 0)).toMatchSnapshot();
      expect(applyPagination(ELASTIC_SEARCH_QUERY, 100, 100)).toMatchSnapshot();
    });
  });

  describe("applySortingRules", () => {
    test("Basic sorting is correctly applied to the query", async () => {
      // Single Sorting rule, descending.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "data.attributes.testColumn1", desc: true }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Single Sorting rule, ascending.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [{ id: "data.attributes.testColumn1", desc: false }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Multiple sorting rules.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [
            { id: "data.attributes.testColumn1", desc: false },
            { id: "data.attributes.testColumn2", desc: true }
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
          [{ id: "data.attributes.testColumn4", desc: true }],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Multiple Relationship Sorting rules.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [
            { id: "data.attributes.testColumn4", desc: true },
            { id: "data.attributes.testColumn5", desc: false }
          ],
          columnDefinitions as any
        )
      ).toMatchSnapshot();

      // Finally, a mix of normal and relationship sorting rules.
      expect(
        applySortingRules(
          ELASTIC_SEARCH_QUERY,
          [
            { id: "data.attributes.testColumn1", desc: false },
            { id: "data.attributes.testColumn2", desc: true },
            { id: "data.attributes.testColumn4", desc: true },
            { id: "data.attributes.testColumn5", desc: false }
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

  // describe("applyRootQuery", () => {

  // });
});
