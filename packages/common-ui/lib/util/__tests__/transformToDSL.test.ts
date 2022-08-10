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
    label: "allowDuplicateName",
    accessor: "data.attributes.allowDuplicateName"
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
          type: "keyword",
          matchType: "equals",
          textMatchType: "exact",
          matchValue: "CNC001"
        },
        {
          fieldName: "data.attributes.materialSampleType",
          type: "text",
          matchType: "equals",
          textMatchType: "partial",
          matchValue: "WHOLE_ORGANISM"
        },
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "equals"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "equals",
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

  it("DSL Query for numerical match type queries", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "greaterThan",
          date: "2022-04-11"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "greaterThanOrEqualTo",
          date: "2022-04-12"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "lessThan",
          date: "2022-04-13"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "lessThanOrEqualTo",
          date: "2022-04-14"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "equals",
          date: "2022-04-15"
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
              range: {
                "data.attributes.createdOn": {
                  gt: "2022-04-11"
                }
              }
            },
            {
              range: {
                "data.attributes.createdOn": {
                  gte: "2022-04-12"
                }
              }
            },
            {
              range: {
                "data.attributes.createdOn": {
                  lt: "2022-04-13"
                }
              }
            },
            {
              range: {
                "data.attributes.createdOn": {
                  lte: "2022-04-14"
                }
              }
            },
            {
              term: {
                "data.attributes.createdOn": "2022-04-15"
              }
            }
          ]
        }
      }
    });
  });

  it("DSL Query for numerical match type contains queries", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "contains",
          date: "2022"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "contains",
          date: "2022-04"
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "contains",
          date: "2022-04-13"
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
              range: {
                "data.attributes.createdOn": {
                  format: "yyyy",
                  gte: "2022||/y",
                  lte: "2022||/y"
                }
              }
            },
            {
              range: {
                "data.attributes.createdOn": {
                  format: "yyyy-MM",
                  gte: "2022-04||/M",
                  lte: "2022-04||/M"
                }
              }
            },
            {
              range: {
                "data.attributes.createdOn": {
                  format: "yyyy-MM-dd",
                  gte: "2022-04-13||/d",
                  lte: "2022-04-13||/d"
                }
              }
            }
          ]
        }
      }
    });
  });

  it("Text Search DSL query generation", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "equals",
          textMatchType: "partial"
        },
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "equals",
          textMatchType: "exact"
        },
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "notEmpty"
        },
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "empty"
        },
        {
          fieldName: "collection.name",
          type: "text",
          matchValue: "test",
          matchType: "equals",
          textMatchType: "partial",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.name",
          type: "text",
          matchValue: "test",
          matchType: "equals",
          textMatchType: "exact",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.name",
          type: "text",
          matchValue: "test",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.name",
          type: "text",
          matchValue: "test",
          matchType: "empty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        }
      ]
    };

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
      defaultSorting,
      submittedValues
    );

    // Ensure boolean DSL query generation matches what is expected.
    expect(dsl).toEqual({
      size: DEFAULT_LIMIT,
      from: DEFAULT_OFFSET,
      query: {
        bool: {
          must: [
            {
              match: {
                "data.attributes.materialSampleName": "test"
              }
            },
            {
              term: {
                "data.attributes.materialSampleName": "test"
              }
            },
            {
              exists: {
                field: "data.attributes.materialSampleName"
              }
            },
            {
              term: {
                "data.attributes.materialSampleName": "NULL"
              }
            }
          ]
        }
      }
    });
  });

  it("Boolean Search DSL query generation", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "equals"
        },
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "notEmpty"
        },
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "empty"
        },
        {
          fieldName: "collection.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "equals",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "empty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        }
      ]
    };

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
      defaultSorting,
      submittedValues
    );

    // Ensure boolean DSL query generation matches what is expected.
    expect(dsl).toEqual({
      size: DEFAULT_LIMIT,
      from: DEFAULT_OFFSET,
      query: {
        bool: {
          must: [
            {
              term: {
                "data.attributes.allowDuplicateName": "true"
              }
            },
            {
              exists: {
                field: "data.attributes.allowDuplicateName"
              }
            },
            {
              term: {
                "data.attributes.allowDuplicateName": "NULL"
              }
            },
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          "included.type": "collection"
                        }
                      },
                      {
                        term: {
                          "included.allowDuplicateName": "true"
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          "included.type": "collection"
                        }
                      },
                      {
                        exists: {
                          field: "included.allowDuplicateName"
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          "included.type": "collection"
                        }
                      },
                      {
                        term: {
                          "included.allowDuplicateName": "NULL"
                        }
                      }
                    ]
                  }
                }
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
