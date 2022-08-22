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

// Based on the column definition above, it will only display these columns in the search results.
const SOURCE_FILTERS: string[] = [
  "data.id",
  "data.type",
  "data.attributes.materialSampleName",
  "data.attributes.materialSampleType",
  "data.attributes.allowDuplicateName",
  "included.attributes.name",
  "included.id",
  "included.type"
];

describe("Transform to DSL query function", () => {
  it("Submitted values to DSL query", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            // First Query Row
            {
              bool: {
                must: {
                  term: {
                    "data.attributes.materialSampleName.keyword": "CNC001"
                  }
                }
              }
            },

            // Second Query Row
            {
              bool: {
                must: {
                  match: {
                    "data.attributes.materialSampleType": "WHOLE_ORGANISM"
                  }
                }
              }
            },

            // Third Query Row
            {
              bool: {
                must: {
                  term: {
                    "data.attributes.allowDuplicateName": "true"
                  }
                }
              }
            },

            // Forth Query Row
            {
              bool: {
                must: {
                  term: {
                    "data.attributes.createdOn": "2022-04-11"
                  }
                }
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            // First Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      gt: "2022-04-11"
                    }
                  }
                }
              }
            },

            // Second Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      gte: "2022-04-12"
                    }
                  }
                }
              }
            },

            // Third Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      lt: "2022-04-13"
                    }
                  }
                }
              }
            },

            // Forth Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      lte: "2022-04-14"
                    }
                  }
                }
              }
            },

            // Fifth Query Row
            {
              bool: {
                must: {
                  term: {
                    "data.attributes.createdOn": "2022-04-15"
                  }
                }
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            // First Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      format: "yyyy",
                      gte: "2022||/y",
                      lte: "2022||/y"
                    }
                  }
                }
              }
            },

            // Second Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      format: "yyyy-MM",
                      gte: "2022-04||/M",
                      lte: "2022-04||/M"
                    }
                  }
                }
              }
            },

            // Third Query Row
            {
              bool: {
                must: {
                  range: {
                    "data.attributes.createdOn": {
                      format: "yyyy-MM-dd",
                      gte: "2022-04-13||/d",
                      lte: "2022-04-13||/d"
                    }
                  }
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
        // Query Row #1
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "equals",
          textMatchType: "partial"
        },

        // Query Row #2
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "equals",
          textMatchType: "exact"
        },

        // Query Row #3
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "notEmpty"
        },

        // Query Row #4
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "empty"
        },

        // Query Row #5
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

        // Query Row #6
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

        // Query Row #7
        {
          fieldName: "collection.name",
          type: "text",
          matchValue: "test",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },

        // Query Row #8
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            // Query Row #1
            {
              bool: {
                must: {
                  match: {
                    "data.attributes.materialSampleName": "test"
                  }
                }
              }
            },

            // Query Row #2
            {
              bool: {
                must: {
                  term: {
                    "data.attributes.materialSampleName.keyword": "test"
                  }
                }
              }
            },

            // Query Row #3
            {
              bool: {
                must: {
                  wildcard: {
                    "data.attributes.materialSampleName": "*"
                  }
                }
              }
            },

            // Query Row #4
            {
              bool: {
                must_not: {
                  wildcard: {
                    "data.attributes.materialSampleName": "*"
                  }
                }
              }
            },

            // Query Row #5
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
                        match: {
                          "included.attributes.name": "test"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #6
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
                          "included.attributes.name.keyword": "test"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #7
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
                        wildcard: {
                          "included.attributes.name": "*"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #8
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: {
                      match: {
                        "included.type": "collection"
                      }
                    },
                    must_not: {
                      wildcard: {
                        "included.attributes.name": "*"
                      }
                    }
                  }
                }
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
          matchType: "notEmpty"
        },
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
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
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.allowDuplicateName",
          type: "boolean",
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
      _source: SOURCE_FILTERS,
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
                          "included.attributes.allowDuplicateName": "true"
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
                          field: "included.attributes.allowDuplicateName"
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
                    must: {
                      match: {
                        "included.type": "collection"
                      }
                    },
                    must_not: [
                      {
                        exists: {
                          field: "included.attributes.allowDuplicateName"
                        }
                      }
                    ]
                  }
                }
              }
            }
          ],
          must_not: [
            {
              exists: {
                field: "data.attributes.allowDuplicateName"
              }
            }
          ]
        }
      }
    });
  });

  it("Number Search DSL query generation", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.number1",
          type: "byte",
          number: "1",
          matchType: "equals"
        },
        {
          fieldName: "data.attributes.number2",
          type: "integer",
          number: "1",
          matchType: "notEquals"
        },
        {
          fieldName: "data.attributes.number3",
          type: "short",
          number: "22",
          matchType: "greaterThan"
        },
        {
          fieldName: "data.attributes.number4",
          type: "long",
          number: "333",
          matchType: "greaterThanOrEqualTo"
        },
        {
          fieldName: "data.attributes.number5",
          type: "float",
          number: "4444.3",
          matchType: "lessThan"
        },
        {
          fieldName: "data.attributes.number6",
          type: "double",
          number: "5555.5",
          matchType: "lessThanOrEqualTo"
        },
        {
          fieldName: "data.attributes.number7",
          type: "integer",
          matchType: "notEmpty"
        },
        {
          fieldName: "data.attributes.number8",
          type: "integer",
          matchType: "empty"
        },
        {
          fieldName: "collection.number9",
          type: "integer",
          number: "12345",
          matchType: "equals",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.number10",
          type: "integer",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },
        {
          fieldName: "collection.number11",
          type: "integer",
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            {
              term: {
                "data.attributes.number1": "1"
              }
            },
            {
              range: {
                "data.attributes.number3": {
                  gt: "22"
                }
              }
            },
            {
              range: {
                "data.attributes.number4": {
                  gte: "333"
                }
              }
            },
            {
              range: {
                "data.attributes.number5": {
                  lt: "4444.3"
                }
              }
            },
            {
              range: {
                "data.attributes.number6": {
                  lte: "5555.5"
                }
              }
            },
            {
              exists: {
                field: "data.attributes.number7"
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
                          "included.attributes.number9": "12345"
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
                          field: "included.attributes.number10"
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
                    must: {
                      match: {
                        "included.type": "collection"
                      }
                    },
                    must_not: [
                      {
                        exists: {
                          field: "included.attributes.number11"
                        }
                      }
                    ]
                  }
                }
              }
            }
          ],
          must_not: [
            {
              term: {
                "data.attributes.number2": "1"
              }
            },
            {
              exists: {
                field: "data.attributes.number8"
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
      _source: SOURCE_FILTERS,
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
      from: 50,
      _source: SOURCE_FILTERS
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
      _source: SOURCE_FILTERS,
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
      _source: SOURCE_FILTERS,
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

  it("Empty values should not generate any queries", async () => {
    const submittedValues: TransformQueryToDSLParams = {
      group: "",
      queryRows: [
        {
          fieldName: "data.attributes.materialSampleName",
          type: "keyword",
          matchType: "equals",
          textMatchType: "exact",
          matchValue: ""
        },
        {
          fieldName: "data.attributes.materialSampleType",
          type: "text",
          matchType: "equals",
          textMatchType: "partial",
          matchValue: ""
        },
        {
          fieldName: "data.attributes.createdOn",
          type: "date",
          matchType: "equals",
          date: ""
        },
        {
          fieldName: "data.attributes.version",
          type: "integer",
          matchType: "equals",
          number: ""
        }
      ]
    };

    const dsl = transformQueryToDSL(
      defaultPagination,
      columnDefinitions,
      defaultSorting,
      submittedValues
    );

    // None of the above should have generated any queries.
    expect(dsl).toEqual({
      from: DEFAULT_OFFSET,
      size: DEFAULT_LIMIT,
      _source: SOURCE_FILTERS
    });
  });
});
