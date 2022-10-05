// ! This needs to be converted into the new QueryBuilderElasticSearchExport tests.

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
              term: {
                "data.attributes.materialSampleName.keyword": "CNC001"
              }
            },

            // Second Query Row
            {
              match: {
                "data.attributes.materialSampleType": "WHOLE_ORGANISM"
              }
            },

            // Third Query Row
            {
              term: {
                "data.attributes.allowDuplicateName": "true"
              }
            },

            // Forth Query Row
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            // First Query Row
            {
              range: {
                "data.attributes.createdOn": {
                  gt: "2022-04-11"
                }
              }
            },

            // Second Query Row
            {
              range: {
                "data.attributes.createdOn": {
                  gte: "2022-04-12"
                }
              }
            },

            // Third Query Row
            {
              range: {
                "data.attributes.createdOn": {
                  lt: "2022-04-13"
                }
              }
            },

            // Forth Query Row
            {
              range: {
                "data.attributes.createdOn": {
                  lte: "2022-04-14"
                }
              }
            },

            // Fifth Query Row
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
      _source: SOURCE_FILTERS,
      query: {
        bool: {
          must: [
            // First Query Row
            {
              range: {
                "data.attributes.createdOn": {
                  format: "yyyy",
                  gte: "2022||/y",
                  lte: "2022||/y"
                }
              }
            },

            // Second Query Row
            {
              range: {
                "data.attributes.createdOn": {
                  format: "yyyy-MM",
                  gte: "2022-04||/M",
                  lte: "2022-04||/M"
                }
              }
            },

            // Third Query Row
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
          matchType: "notEquals",
          textMatchType: "partial"
        },

        // Query Row #4
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "notEquals",
          textMatchType: "exact"
        },

        // Query Row #5
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "notEmpty"
        },

        // Query Row #6
        {
          fieldName: "data.attributes.materialSampleName",
          type: "text",
          matchValue: "test",
          matchType: "empty"
        },

        // Query Row #7
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

        // Query Row #8
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

        // Query Row #9
        {
          fieldName: "collection.name",
          type: "text",
          matchValue: "test",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },

        // Query Row #10
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
              match: {
                "data.attributes.materialSampleName": "test"
              }
            },

            // Query Row #2
            {
              term: {
                "data.attributes.materialSampleName.keyword": "test"
              }
            },

            // Query Row #3
            {
              bool: {
                should: [
                  {
                    bool: {
                      must_not: {
                        match: {
                          "data.attributes.materialSampleName": "test"
                        }
                      }
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.attributes.materialSampleName"
                        }
                      }
                    }
                  }
                ]
              }
            },

            // Query Row #4
            {
              bool: {
                should: [
                  {
                    bool: {
                      must_not: {
                        term: {
                          "data.attributes.materialSampleName.keyword": "test"
                        }
                      }
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.attributes.materialSampleName"
                        }
                      }
                    }
                  }
                ]
              }
            },

            // Query Row #5
            {
              bool: {
                must: {
                  exists: {
                    field: "data.attributes.materialSampleName"
                  }
                },
                must_not: {
                  term: {
                    "data.attributes.materialSampleName.keyword": ""
                  }
                }
              }
            },

            // Query Row #6
            {
              bool: {
                should: [
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.attributes.materialSampleName"
                        }
                      }
                    }
                  },
                  {
                    bool: {
                      must: {
                        term: {
                          "data.attributes.materialSampleName.keyword": ""
                        }
                      }
                    }
                  }
                ]
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
                          "included.attributes.name": "test"
                        }
                      },
                      {
                        term: {
                          "included.type": "collection"
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
                    must: [
                      {
                        term: {
                          "included.attributes.name.keyword": "test"
                        }
                      },
                      {
                        term: {
                          "included.type": "collection"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #9
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "included.type": "collection"
                        }
                      },
                      {
                        exists: {
                          field: "included.attributes.name"
                        }
                      }
                    ],
                    must_not: {
                      term: {
                        "included.attributes.name.keyword": ""
                      }
                    }
                  }
                }
              }
            },

            // Query Row #10
            {
              bool: {
                should: [
                  {
                    bool: {
                      should: [
                        {
                          bool: {
                            must_not: {
                              nested: {
                                path: "included",
                                query: {
                                  bool: {
                                    must: [
                                      {
                                        exists: {
                                          field: "included.attributes.name"
                                        }
                                      },
                                      {
                                        term: {
                                          "included.type": "collection"
                                        }
                                      }
                                    ]
                                  }
                                }
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
                                    term: {
                                      "included.attributes.name.keyword": ""
                                    }
                                  },
                                  {
                                    term: {
                                      "included.type": "collection"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        }
                      ]
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.relationships.collection.data.id"
                        }
                      }
                    }
                  }
                ]
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
        // Query Row #1
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "equals"
        },

        // Query Row #2
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          matchType: "notEmpty"
        },

        // Query Row #3
        {
          fieldName: "data.attributes.allowDuplicateName",
          type: "boolean",
          matchType: "empty"
        },

        // Query Row #4
        {
          fieldName: "collection.allowDuplicateName",
          type: "boolean",
          boolean: "true",
          matchType: "equals",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },

        // Query Row #5
        {
          fieldName: "collection.allowDuplicateName",
          type: "boolean",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },

        // Query Row #6
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
            // Query Row #1
            {
              term: {
                "data.attributes.allowDuplicateName": "true"
              }
            },

            // Query Row #2
            {
              exists: {
                field: "data.attributes.allowDuplicateName"
              }
            },

            // Query Row #3
            {
              bool: {
                must_not: {
                  exists: {
                    field: "data.attributes.allowDuplicateName"
                  }
                }
              }
            },

            // Query Row #4
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "included.attributes.allowDuplicateName": "true"
                        }
                      },
                      {
                        term: {
                          "included.type": "collection"
                        }
                      }
                    ]
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
                        exists: {
                          field: "included.attributes.allowDuplicateName"
                        }
                      },
                      {
                        term: {
                          "included.type": "collection"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #6
            {
              bool: {
                should: [
                  {
                    bool: {
                      must_not: {
                        nested: {
                          path: "included",
                          query: {
                            bool: {
                              must: [
                                {
                                  exists: {
                                    field:
                                      "included.attributes.allowDuplicateName"
                                  }
                                },
                                {
                                  term: {
                                    "included.type": "collection"
                                  }
                                }
                              ]
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.relationships.collection.data.id"
                        }
                      }
                    }
                  }
                ]
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
        // Query Row #1
        {
          fieldName: "data.attributes.number1",
          type: "byte",
          number: "1",
          matchType: "equals"
        },

        // Query Row #2
        {
          fieldName: "data.attributes.number2",
          type: "integer",
          number: "1",
          matchType: "notEquals"
        },

        // Query Row #3
        {
          fieldName: "data.attributes.number3",
          type: "short",
          number: "22",
          matchType: "greaterThan"
        },

        // Query Row #4
        {
          fieldName: "data.attributes.number4",
          type: "long",
          number: "333",
          matchType: "greaterThanOrEqualTo"
        },

        // Query Row #5
        {
          fieldName: "data.attributes.number5",
          type: "float",
          number: "4444.3",
          matchType: "lessThan"
        },

        // Query Row #6
        {
          fieldName: "data.attributes.number6",
          type: "double",
          number: "5555.5",
          matchType: "lessThanOrEqualTo"
        },

        // Query Row #7
        {
          fieldName: "data.attributes.number7",
          type: "integer",
          matchType: "notEmpty"
        },

        // Query Row #8
        {
          fieldName: "data.attributes.number8",
          type: "integer",
          matchType: "empty"
        },

        // Query Row #9
        {
          fieldName: "collection.number9",
          type: "integer",
          number: "12345",
          matchType: "equals",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },

        // Query Row #10
        {
          fieldName: "collection.number10",
          type: "integer",
          matchType: "notEmpty",
          parentName: "collection",
          parentType: "collection",
          parentPath: "included"
        },

        // Query Row #11
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
            // Query Row #1
            {
              term: {
                "data.attributes.number1": "1"
              }
            },

            // Query Row #2
            {
              bool: {
                should: [
                  {
                    bool: {
                      must_not: {
                        term: {
                          "data.attributes.number2": "1"
                        }
                      }
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.attributes.number2"
                        }
                      }
                    }
                  }
                ]
              }
            },

            // Query Row #3
            {
              range: {
                "data.attributes.number3": {
                  gt: "22"
                }
              }
            },

            // Query Row #4
            {
              range: {
                "data.attributes.number4": {
                  gte: "333"
                }
              }
            },

            // Query Row #5
            {
              range: {
                "data.attributes.number5": {
                  lt: "4444.3"
                }
              }
            },

            // Query Row #6
            {
              range: {
                "data.attributes.number6": {
                  lte: "5555.5"
                }
              }
            },

            // Query Row #7
            {
              exists: {
                field: "data.attributes.number7"
              }
            },

            // Query Row #8
            {
              bool: {
                must_not: {
                  exists: {
                    field: "data.attributes.number8"
                  }
                }
              }
            },

            // Query Row #9
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "included.attributes.number9": "12345"
                        }
                      },
                      {
                        term: {
                          "included.type": "collection"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #10
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must: [
                      {
                        exists: {
                          field: "included.attributes.number10"
                        }
                      },
                      {
                        term: {
                          "included.type": "collection"
                        }
                      }
                    ]
                  }
                }
              }
            },

            // Query Row #11
            {
              bool: {
                should: [
                  {
                    bool: {
                      must_not: {
                        nested: {
                          path: "included",
                          query: {
                            bool: {
                              must: [
                                {
                                  exists: {
                                    field: "included.attributes.number11"
                                  }
                                },
                                {
                                  term: {
                                    "included.type": "collection"
                                  }
                                }
                              ]
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: "data.relationships.collection.data.id"
                        }
                      }
                    }
                  }
                ]
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
          must: [
            // Group Query Row
            {
              term: {
                "data.attributes.group": "cnc"
              }
            }
          ]
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
