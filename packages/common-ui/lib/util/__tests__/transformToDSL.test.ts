import { SortingRule } from "react-table";
import { LimitOffsetPageSpec } from "../..";
import {
  transformQueryToDSL,
  TransformQueryToDSLParams
} from "../transformToDSL";

const DEFAULT_LIMIT = 25;
const DEFAULT_OFFSET = 0;

const defaultPagination: LimitOffsetPageSpec = {
  limit: DEFAULT_LIMIT,
  offset: DEFAULT_OFFSET
};

const defaultSorting: SortingRule[] = [];

const defaultSubmittedValues: TransformQueryToDSLParams = {
  group: "",
  queryRows: []
};

describe("Transform to DSL function", () => {
  it("Submitted values to DSL", async () => {
    // Add this test.
  });

  it("Group settings to DSL", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "cnc",
      queryRows: []
    };

    const dsl = transformQueryToDSL(
      defaultPagination,
      defaultSorting,
      submittedValues
    );

    // Ensure that the default pagination and group filter is added.
    expect(dsl).toEqual({
      size: DEFAULT_LIMIT,
      from: DEFAULT_OFFSET,
      query: {
        bool: {
          filter: {
            term: {
              "data.attributes.group": "cnc"
            }
          }
        }
      }
    });
  });

  it("Pagination settings to DSL", async () => {
    const pagination: LimitOffsetPageSpec = {
      limit: 50,
      offset: 50
    };

    const dsl = transformQueryToDSL(
      pagination,
      defaultSorting,
      defaultSubmittedValues
    );

    // The only thing added to the DSL should be the pagination.
    expect(dsl).toEqual({
      size: 50,
      from: 50
    });
  });

  it("Sorting settings to DSL", async () => {
    const sorting: SortingRule[] = [
      {
        id: "fieldName1",
        desc: true
      },
      {
        id: "fieldName2",
        desc: false
      }
    ];

    const dsl = transformQueryToDSL(
      defaultPagination,
      sorting,
      defaultSubmittedValues
    );

    // Ensure default pagination and sorting rules are applied correctly.
    expect(dsl).toEqual({
      from: DEFAULT_OFFSET,
      size: DEFAULT_LIMIT,
      sort: [
        {
          fieldName1: {
            order: "desc"
          }
        },
        {
          fieldName2: {
            order: "asc"
          }
        }
      ]
    });
  });
});
