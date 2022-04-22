import Select from "react-select";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { QueryPage, TableColumn } from "../QueryPage";
import DatePicker from "react-datepicker";
import { PersistedResource } from "kitsu";
import { Group } from "packages/dina-ui/types/user-api";

/** Mock resources returned by elastic search mapping from api. */
const MOCK_INDEX_MAPPING_RESP = {
  data: {
    headers: {},
    body: {
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
      relationships: []
    },
    statusCode: "OK",
    statusCodeValue: 200
  }
};

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

// Mock elastic search data to use with the query page.
const TEST_ELASTIC_SEARCH_RESPONSE = {
  data: {
    hits: {
      total: {
        value: 1
      },
      hits: [
        {
          _source: {
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
          }
        }
      ]
    }
  }
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "search-api/search-ws/mapping":
      return MOCK_INDEX_MAPPING_RESP;
    case "user-api/group":
      return TEST_GROUP;
    case "user-api/user-preference":
      return USER_PREFERENCE;
  }
});

const mockPost = jest.fn<any, any>(async path => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return TEST_ELASTIC_SEARCH_RESPONSE;
  }
});

const TEST_SEARCH_DATE =
  "Tue Jan 25 2022 21:05:30 GMT+0000 (Coordinated Universal Time)";

const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet,
      post: mockPost
    }
  }
};

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
        query: {
          bool: {
            filter: {
              term: {
                "data.attributes.group": "aafc"
              }
            }
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
        query: {
          bool: {
            filter: { term: { "data.attributes.group": "cnc" } },
            must: [
              { term: { "data.attributes.createdOn": "2022-01-25" } },
              { term: { "data.attributes.publiclyReleasable": "false" } }
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
});
