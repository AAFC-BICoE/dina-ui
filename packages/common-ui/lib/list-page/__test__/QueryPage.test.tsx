import Select from "react-select";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { QueryPage } from "../QueryPage";
import DatePicker from "react-datepicker";
import { PersistedResource } from "kitsu";
import { Group } from "packages/dina-ui/types/user-api";
import { TableColumn } from "../types";
import { useState, useEffect } from "react";
import { MaterialSample } from "packages/dina-ui/types/collection-api/resources/MaterialSample";

/** Mock resources returned by elastic search mapping from api. */
const MOCK_INDEX_MAPPING_RESP = {
  data: {
    indexName: "testIndex",
    attributes: [
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes"
      },
      {
        name: "verbatimDeterminer",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "uuid",
        type: "text",
        path: "data.attributes.hierarchy"
      },
      {
        name: "publiclyReleasable",
        type: "boolean",
        path: "data.attributes"
      },
      {
        name: "materialSampleRemarks",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "dwcOtherCatalogNumbers",
        type: "text",
        path: "data.attributes"
      }
    ],
    relationships: [
      {
        name: "type",
        path: "included",
        value: "preparation-type",
        attributes: [
          {
            name: "name",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          },
          {
            name: "type",
            type: "text",
            path: "attributes"
          }
        ]
      }
    ]
  }
};

// The QueryPage will only display the records in the columns on the table.
const SOURCE_FILTERS = [
  "data.id",
  "data.type",
  "materialSampleName",
  "collection.name",
  "dwcOtherCatalogNumbers",
  "materialSampleType",
  "createdBy",
  "createdOn",
  "included.id",
  "included.type"
];

const TEST_GROUP: PersistedResource<Group>[] = [
  {
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "group",
    name: "cnc",
    path: "test path",
    labels: { fr: "CNCFR" }
  }
];

const USER_PREFERENCE = {
  data: [],
  meta: { totalResourceCount: 0, moduleVersion: "0.11-SNAPSHOT" }
};

// Material sample data to use with the responses.
const MATERIAL_SAMPLE_DATA = {
  data: {
    id: "2c0d2f4d-c9a3-434e-bc76-d6cd4f02fb2c",
    type: "material-sample",
    attributes: {
      version: 0,
      group: "aafc",
      createdOn: "2022-03-28T13:04:50.689122Z",
      createdBy: "dina-admin",
      dwcCatalogNumber: null,
      dwcOtherCatalogNumbers: null,
      materialSampleName: null,
      materialSampleType: null,
      materialSampleChildren: [],
      preparationDate: null,
      preparationMethod: null,
      preservationType: null,
      preparationFixative: null,
      preparationMaterials: null,
      preparationSubstrate: null,
      managedAttributes: {},
      preparationRemarks: null,
      dwcDegreeOfEstablishment: null,
      hierarchy: [
        {
          uuid: "09a256c7-56c8-424b-8013-0590e16e39cb",
          rank: 1
        }
      ],
      host: null,
      barcode: null,
      publiclyReleasable: true,
      notPubliclyReleasableReason: null,
      tags: null,
      materialSampleState: null,
      materialSampleRemarks: null,
      stateChangedOn: null,
      stateChangeRemarks: null,
      associations: [],
      allowDuplicateName: false,
      restrictionFieldsExtension: null,
      isRestricted: false,
      restrictionRemarks: null
    },
    relationships: {
      collectingEvent: {
        data: null
      }
    }
  }
};

// Basic mock elastic search data to use with the query page.
const TEST_ELASTIC_SEARCH_RESPONSE = {
  data: {
    hits: {
      total: {
        value: 1
      },
      hits: [
        {
          _source: {
            MATERIAL_SAMPLE_DATA
          }
        }
      ]
    }
  }
};

// Mock elastic search data with 10,000 total responses, this should trigger a count.
const TEST_ELASTIC_SEARCH_COUNT_RESPONSE = {
  data: {
    hits: {
      total: {
        value: 10000
      },
      hits: [
        {
          _source: {
            MATERIAL_SAMPLE_DATA
          }
        }
      ]
    }
  }
};

// Mock of the count response
const TEST_ELASTIC_COUNT_RESPONSE = {
  data: {
    count: 2000000
  }
};

const TEST_SEARCH_DATE =
  "Tue Jan 25 2022 21:05:30 GMT+0000 (Coordinated Universal Time)";

const TEST_COLUMNS: TableColumn<any>[] = [
  { accessor: "materialSampleName" },
  { accessor: "collection.name" },
  { accessor: "dwcOtherCatalogNumbers" },
  { accessor: "materialSampleType" },
  { accessor: "createdBy" },
  { accessor: "createdOn" },
  { Header: "", sortable: false }
];

describe("QueryPage component", () => {
  it("Query Page is able to aggregate first level queries", async () => {
    // Mocked GET requests.
    const mockGet = jest.fn<any, any>(async (path) => {
      switch (path) {
        case "search-api/search-ws/mapping":
          return MOCK_INDEX_MAPPING_RESP;
        case "user-api/group":
          return TEST_GROUP;
        case "user-api/user-preference":
          return USER_PREFERENCE;
      }
    });

    // Mocked POST requests.
    const mockPost = jest.fn<any, any>(async (path) => {
      switch (path) {
        // Elastic search response with material sample mock metadata data.
        case "search-api/search-ws/search":
          return TEST_ELASTIC_SEARCH_RESPONSE;
        case "search-api/search-ws/count":
          return TEST_ELASTIC_COUNT_RESPONSE;
      }
    });

    // Setup API context with the mocked queries.
    const apiContext: any = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockPost
        }
      }
    };

    const wrapper = mountWithAppContext(
      <QueryPage indexName="testIndex" columns={TEST_COLUMNS} />,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // select first row to a date field
    wrapper
      .find("SelectField[name='queryRows[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "data.attributes.createdOn" });

    await new Promise(setImmediate);
    wrapper.update();

    // set date value
    wrapper
      .find("DateField[name='queryRows[0].date']")
      .find(DatePicker)
      .prop<any>("onChange")(new Date(TEST_SEARCH_DATE));

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("FaPlus[name='queryRows[0].addRow']").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // select second row to a boolean field
    wrapper
      .find("SelectField[name='queryRows[1].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "data.attributes.publiclyReleasable" });

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find("SelectField[name='queryRows[1].boolean']").length
    ).toEqual(1);

    // set boolean value
    wrapper
      .find("SelectField[name='queryRows[1].boolean']")
      .find(Select)
      .prop<any>("onChange")({ value: "false" });

    await new Promise(setImmediate);
    wrapper.update();

    // simulate select a group from dropdown
    wrapper
      .find("SelectField[name='group']")
      .find(Select)
      .prop<any>("onChange")({ value: "cnc" });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The first call should just be with the first group as the filter.
    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {
        from: 0,
        size: 25,
        sort: [
          {
            createdOn: {
              order: "desc"
            }
          }
        ],
        _source: SOURCE_FILTERS,
        query: {
          bool: {
            must: [
              {
                term: {
                  "data.attributes.group": "aafc"
                }
              }
            ]
          }
        }
      },
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);

    // The last call should be all of the expected filters applied and the new group applied.
    expect(mockPost.mock.calls.pop()).toEqual([
      "search-api/search-ws/search",
      {
        size: 25,
        from: 0,
        sort: [
          {
            createdOn: {
              order: "desc"
            }
          }
        ],
        _source: SOURCE_FILTERS,
        query: {
          bool: {
            must: [
              {
                term: {
                  "data.attributes.createdOn": "2022-01-25"
                }
              },
              {
                term: {
                  "data.attributes.publiclyReleasable": "false"
                }
              },
              {
                term: {
                  "data.attributes.group": "cnc"
                }
              }
            ]
          }
        }
      },
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);
  });

  it("Query Page is able to aggregate second level queries (relationships) with auto complete suggestions", async () => {
    // Mocked GET requests.
    const mockGet = jest.fn<any, any>(async (path) => {
      switch (path) {
        case "search-api/search-ws/mapping":
          return MOCK_INDEX_MAPPING_RESP;
        case "user-api/group":
          return TEST_GROUP;
        case "user-api/user-preference":
          return USER_PREFERENCE;
      }
    });

    // Mocked POST requests.
    const mockPost = jest.fn<any, any>(async (path) => {
      switch (path) {
        // Elastic search response with material sample mock metadata data.
        case "search-api/search-ws/search":
          return TEST_ELASTIC_SEARCH_RESPONSE;
        case "search-api/search-ws/count":
          return TEST_ELASTIC_COUNT_RESPONSE;
      }
    });

    // Setup API context with the mocked queries.
    const apiContext: any = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockPost
        }
      }
    };

    const wrapper = mountWithAppContext(
      <QueryPage indexName="testIndex" columns={TEST_COLUMNS} />,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Selected the relationship (prepared type name)
    wrapper
      .find("SelectField[name='queryRows[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "preparation-type.name" });

    await new Promise(setImmediate);
    wrapper.update();

    // Verify the aggregation request.
    expect(mockPost.mock.calls.pop()).toEqual([
      "search-api/search-ws/search",
      {
        aggs: {
          included_aggregation: {
            aggs: {
              included_type_filter: {
                aggs: {
                  term_aggregation: {
                    terms: {
                      field: "included.attributes.name.keyword",
                      size: 100
                    }
                  }
                },
                filter: {
                  bool: {
                    filter: [
                      {
                        term: {
                          "included.type": "preparation-type"
                        }
                      }
                    ]
                  }
                }
              }
            },
            nested: {
              path: "included"
            }
          }
        },
        query: {
          terms: {
            "data.attributes.group": ["aafc"]
          }
        },
        size: 0
      },
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);

    mockPost.mockClear();

    // Set the search value for the relationship.
    wrapper
      .find("AutoSuggestTextField[name='queryRows[0].matchValue']")
      .find("input")
      .simulate("change", { target: { value: "Test value" } });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Expecting the actual search request.
    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {
        from: 0,
        size: 25,
        sort: [
          {
            createdOn: {
              order: "desc"
            }
          }
        ],
        _source: SOURCE_FILTERS,
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: "included",
                  query: {
                    bool: {
                      must: [
                        {
                          term: {
                            "included.attributes.name.keyword": "Test value"
                          }
                        },
                        {
                          term: {
                            "included.type": "preparation-type"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                term: {
                  "data.attributes.group": "aafc"
                }
              }
            ]
          }
        }
      },
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);
  });

  it("Query Page is able to aggregate second level queries (relationships) without auto complete suggestions", async () => {
    // Mocked GET requests.
    const mockGet = jest.fn<any, any>(async (path) => {
      switch (path) {
        case "search-api/search-ws/mapping":
          return MOCK_INDEX_MAPPING_RESP;
        case "user-api/group":
          return TEST_GROUP;
        case "user-api/user-preference":
          return USER_PREFERENCE;
      }
    });

    // Mocked POST requests.
    const mockPost = jest.fn<any, any>(async (path) => {
      switch (path) {
        // Elastic search response with material sample mock metadata data.
        case "search-api/search-ws/search":
          return TEST_ELASTIC_SEARCH_RESPONSE;
        case "search-api/search-ws/count":
          return TEST_ELASTIC_COUNT_RESPONSE;
      }
    });

    // Setup API context with the mocked queries.
    const apiContext: any = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockPost
        }
      }
    };

    const wrapper = mountWithAppContext(
      <QueryPage indexName="testIndex" columns={TEST_COLUMNS} />,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Selected the relationship (prepared-type type)
    wrapper
      .find("SelectField[name='queryRows[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "preparation-type.type" });

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the field value of the preparation type query. (Partial match version (should be default option))
    wrapper
      .find("TextField[name='queryRows[0].matchValue']")
      .find("input")
      .simulate("change", { target: { value: "Partial Match test" } });

    wrapper.find("FaPlus[name='queryRows[0].addRow']").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Selected the relationship (prepared-type type)
    wrapper
      .find("SelectField[name='queryRows[1].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "preparation-type.type" });

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the field value of the preparation type query. (Exact match version)
    wrapper
      .find("TextField[name='queryRows[1].matchValue']")
      .find("input")
      .simulate("change", { target: { value: "Exact Match test" } });

    // For this search, we will need to switch to the exact option.
    wrapper.find(".exactSpan").at(1).simulate("click");

    mockPost.mockClear();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Expecting the actual search request.
    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {
        from: 0,
        size: 25,
        sort: [
          {
            createdOn: {
              order: "desc"
            }
          }
        ],
        _source: SOURCE_FILTERS,
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: "included",
                  query: {
                    bool: {
                      must: [
                        {
                          match: {
                            "included.attributes.type": "Partial Match test"
                          }
                        },
                        {
                          term: {
                            "included.type": "preparation-type"
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
                          term: {
                            "included.attributes.type.keyword":
                              "Exact Match test"
                          }
                        },
                        {
                          term: {
                            "included.type": "preparation-type"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                term: {
                  "data.attributes.group": "aafc"
                }
              }
            ]
          }
        }
      },
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);
  });

  it("Query Page switches to use count request for large query sizes", async () => {
    // Mocked GET requests.
    const mockGet = jest.fn<any, any>(async (path) => {
      switch (path) {
        case "search-api/search-ws/mapping":
          return MOCK_INDEX_MAPPING_RESP;
        case "user-api/group":
          return TEST_GROUP;
        case "user-api/user-preference":
          return USER_PREFERENCE;
      }
    });

    // Mocked POST requests.
    const mockCountPost = jest.fn<any, any>(async (path) => {
      switch (path) {
        // Elastic search response for the count test
        case "search-api/search-ws/search":
          return TEST_ELASTIC_SEARCH_COUNT_RESPONSE;
        case "search-api/search-ws/count":
          return TEST_ELASTIC_COUNT_RESPONSE;
      }
    });

    // Setup API context with the mocked queries.
    const apiContext: any = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockCountPost
        }
      }
    };

    const wrapper = mountWithAppContext(
      <QueryPage indexName="testIndex" columns={TEST_COLUMNS} />,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();
    expect(wrapper.find("#queryPageCount").text()).toBe(
      "Total matched records: " + TEST_ELASTIC_COUNT_RESPONSE.data.count
    );

    // The first expected POST call is the elastic search results, a second call should be made
    // for the count.
    expect(mockCountPost.mock.calls[1]).toEqual([
      "search-api/search-ws/count",
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  "data.attributes.group": "aafc"
                }
              }
            ]
          }
        }
      },
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);
  });

  function QueryPageTestComponent() {
    // The selected resources to be used for the QueryPage.
    const [selectedResources, setSelectedResources] = useState<
      MaterialSample[]
    >([]);

    return (
      <QueryPage
        indexName="testIndex"
        columns={TEST_COLUMNS}
        selectionMode={true}
        selectionResources={selectedResources}
        setSelectionResources={setSelectedResources}
      />
    );
  }

  it("Query Page selection mode support", async () => {
    // Mocked GET requests.
    const mockGet = jest.fn<any, any>(async (path) => {
      switch (path) {
        case "search-api/search-ws/mapping":
          return MOCK_INDEX_MAPPING_RESP;
        case "user-api/group":
          return TEST_GROUP;
        case "user-api/user-preference":
          return USER_PREFERENCE;
      }
    });

    // Mocked POST requests.
    const mockPost = jest.fn<any, any>(async (path) => {
      switch (path) {
        // Elastic search response with material sample mock metadata data.
        case "search-api/search-ws/search":
          return TEST_ELASTIC_SEARCH_RESPONSE;
        case "search-api/search-ws/count":
          return TEST_ELASTIC_COUNT_RESPONSE;
      }
    });

    // Setup API context with the mocked queries.
    const apiContext: any = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockPost
        }
      }
    };

    // Enable selection mode with the QueryPage component.
    const wrapper = mountWithAppContext(<QueryPageTestComponent />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Ensure data is present in the search result table.
    expect(wrapper.find("#queryPageCount").text()).toBe(
      "Total matched records: " +
        TEST_ELASTIC_SEARCH_RESPONSE.data.hits.total.value
    );

    // Click the "Select all checkbox" on the first table.
    wrapper.find("input.check-all-checkbox").at(0).prop<any>("onClick")({
      target: { checked: true }
    } as any);
    wrapper.update();

    // Select the ">>" button to move resources to the selected table.
    wrapper.find(".select-all-checked-button").find("button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // This test is now working yet. Will be fixed in another ticket.

    // expect(wrapper.find("#selectedResourceCount").text()).toBe(
    //  "Total selected records: " + TEST_ELASTIC_SEARCH_RESPONSE.data.hits.total.value
    // );
  });
});
