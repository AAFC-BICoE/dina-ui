import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { SortingRule } from "react-table";
import { LimitOffsetPageSpec } from "../..";
import { TableColumn } from "../../list-page/types";
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

const columnDefinitions: TableColumn<MaterialSample>[] = [
  {
    label: "materialSampleName",
    accessor: "data.attributes.materialSampleName",
    isKeyword: true
  },
  {
    label: "materialSampleType",
    accessor: "data.attributes.materialSampleType",
    isKeyword: true
  },
  {
    label: "collection.name",
    accessor: "included.attributes.name",
    isKeyword: true,
    relationshipType: "collection"
  }
];

describe("Transform to DSL query function", () => {
  it("Submitted values to DSL query", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchType: "term",
          matchValue: "CNC001"
        },
        {
          fieldName: "data.attributes.materialSampleType",
          type: "text",
          matchType: "match",
          matchValue: "WHOLE_ORGANISM"
        },
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "match"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "match",
          date: "2022-04-11"
        }
      ]
    };

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
      defaultSorting,
      submittedValues
    );

    // Ensure that the default pagination and query row filters are added.
    expect(dsl).toEqual({
      size: DEFAULT_LIMIT,
      from: DEFAULT_OFFSET,
      query: {
        bool: {
          must: [
            {
              term: {
                "data.attributes.materialSampleName.keyword": "CNC001"
              }
            },
            {
              match: {
                "data.attributes.materialSampleType": "WHOLE_ORGANISM"
              }
            },
            {
              term: {
                "data.attributes.allowDuplicateName": "true"
              }
            },
            {
              term: {
                "data.attributes.createdOn": "2022-04-11"
              }
            }
          ]
        }
      }
    });
  });

  it("Group settings to DSL query", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "cnc",
      queryRows: []
    };

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
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

  it("Pagination settings to DSL query", async () => {
    const pagination: LimitOffsetPageSpec = {
      limit: 50,
      offset: 50
    };

    const dsl = transformQueryToDSL(
      pagination,
      columnDefinitions,
      defaultSorting,
      defaultSubmittedValues
    );

    // The only thing added to the DSL should be the pagination.
    expect(dsl).toEqual({
      size: 50,
      from: 50
    });
  });

  it("Sorting attributes to DSL query", async () => {
    const sorting: SortingRule[] = [
      {
        id: "data.attributes.materialSampleName",
        desc: true
      },
      {
        id: "data.attributes.materialSampleType",
        desc: false
      }
    ];

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
      sorting,
      defaultSubmittedValues
    );

    // Ensure default pagination and sorting rules are applied correctly.
    expect(dsl).toEqual({
      from: DEFAULT_OFFSET,
      size: DEFAULT_LIMIT,
      sort: [
        {
          "data.attributes.materialSampleName.keyword": {
            order: "desc"
          }
        },
        {
          "data.attributes.materialSampleType.keyword": {
            order: "asc"
          }
        }
      ]
    });
  });

  it("Sorting relationships to DSL query", async () => {
    const sorting: SortingRule[] = [
      {
        id: "included.attributes.name",
        desc: true
      }
    ];

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
      sorting,
      defaultSubmittedValues
    );

    // Ensure default pagination and sorting rules are applied correctly.
    expect(dsl).toEqual({
      from: DEFAULT_OFFSET,
      size: DEFAULT_LIMIT,
      sort: [
        {
          "included.attributes.name.keyword": {
            order: "desc",
            nested_path: "included",
            nested_filter: {
              term: {
                "included.type": "collection"
              }
            }
          }
        }
      ]
    });
  });
});
