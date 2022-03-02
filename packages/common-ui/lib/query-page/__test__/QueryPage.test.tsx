import Select from "react-select";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { QueryPage } from "../QueryPage";
import DatePicker from "react-datepicker";
import { ColumnDefinition } from "../../table/QueryTable";

/** Mock resources returned by elastic search mapping from api. */
const MOCK_INDEX_MAPPING_RESP = {
  data: {
    headers: {},
    body: {
      indexName: "dina_material_sample_index",
      attributes: [
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
      relationships: {
        attributes: []
      }
    },
    statusCode: "OK",
    statusCodeValue: 200
  }
};

const MOCK_USER_GROUP_RESP = {
  data: [
    {
      id: "1",
      type: "group",
      name: "cnc"
    },
    {
      id: "2",
      type: "group",
      name: "aafc"
    }
  ]
};

const MOCK_USER_PREFERENCE_RESP = {
  data: [
    {
      id: "1",
      type: "user-preferences",
      userId: "cnc"
    },
    {
      id: "2",
      type: "user-preferences",
      userId: "aafc"
    }
  ]
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "search-api/search-ws/mapping":
      return MOCK_INDEX_MAPPING_RESP;
    case "user-api/group":
      return MOCK_USER_GROUP_RESP;
    case "user-api/user-preferences":
      return MOCK_USER_PREFERENCE_RESP;
  }
});

const mockPost = jest.fn(() => null);

const TEST_SEARCH_DATE =
  "Tue Jan 25 2022 21:05:30 GMT+0000 (Coordinated Universal Time)";

const apiContext = {
  apiClient: {
    axios: { get: mockGet, post: mockPost } as any
  }
} as any;

const TEST_COLUMNS: ColumnDefinition<any>[] = [
  { accessor: "materialSampleName" },
  { accessor: "collection.name" },
  { accessor: "dwcOtherCatalogNumbers" },
  { accessor: "materialSampleType" },
  "createdBy",
  { accessor: "createdOn" },
  { Header: "", sortable: false }
];
describe("QueryPage component", () => {
  it("Query Page is able to aggretate first level queries", async () => {
    const wrapper = mountWithAppContext(
      <QueryPage indexName="testIndex" columns={TEST_COLUMNS} />,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("FaPlus[name='queryRows[0].addRow']").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // select first row to a date field
    wrapper
      .find("SelectField[name='queryRows[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "createdOn(date)" });

    await new Promise(setImmediate);
    wrapper.update();
    // set date value
    wrapper
      .find("DateField[name='queryRows[0].date']")
      .find(DatePicker)
      .prop<any>("onChange")(new Date(TEST_SEARCH_DATE));

    // select second row to a boolean field
    wrapper
      .find("SelectField[name='queryRows[1].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "allowDuplicateName(boolean)" });

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

    // simulate select a group from dropdown
    wrapper
      .find("SelectField[name='group']")
      .find(Select)
      .prop<any>("onChange")({ value: "testGroup" });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet.mock.calls).toEqual([
      [
        "user-api/user-preference",
        {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Crnk-Compact": "true"
          },
          params: {
            filter: {
              userId: undefined
            },
            page: {
              limit: 1000
            }
          },
          paramsSerializer: expect.anything()
        }
      ],
      [
        "search-api/search-ws/mapping",
        {
          params: {
            indexName: "testIndex"
          }
        }
      ],
      [
        "user-api/group",
        {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Crnk-Compact": "true"
          },
          params: {
            filter: '{"name":["aafc","cnc"]}',
            page: {
              limit: 1000
            }
          },
          paramsSerializer: expect.anything()
        }
      ],
      [
        "user-api/group",
        {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Crnk-Compact": "true"
          },
          params: {
            filter: '{"name":["aafc","cnc"]}',
            page: {
              limit: 1000
            }
          },
          paramsSerializer: expect.anything()
        }
      ],
      [
        "user-api/group",
        {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Crnk-Compact": "true"
          },
          params: {
            filter: '{"name":["testGroup","aafc","cnc"]}',
            page: {
              limit: 1000
            }
          },
          paramsSerializer: expect.anything()
        }
      ],
      expect.anything()
    ]);

    expect(mockPost).lastCalledWith(
      "search-api/search-ws/search",
      {
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  {
                    term: {
                      createdOn: "2022-01-25"
                    }
                  },
                  {
                    term: {
                      allowDuplicateName: "false"
                    }
                  }
                ]
              }
            },
            must: {
              match: {
                "data.attributes.group": "testGroup"
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
    );
  });
});
