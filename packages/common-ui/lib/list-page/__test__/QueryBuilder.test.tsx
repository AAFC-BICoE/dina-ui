import Select from "react-select";
import React, { useReducer } from "react";
import { QueryBuilder } from "../QueryBuilder";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import DatePicker from "react-datepicker";
import { queryPageReducer } from "../queryPageReducer";
import { INTEGRATION_TEST_INITIAL_STATES, TEST_INDEX_NAME } from "../types";

const TEST_SEARCH_DATE =
  "Fri Jan 21 2022 21:05:30 GMT+0000 (Coordinated Universal Time)";

/** Options array based on resources returned by elastic search mapping from api. */
const MOCK_INDEX_MAPPING_RESP = {
  data: {
    headers: {},
    body: {
      indexName: TEST_INDEX_NAME,
      attributes: [
        {
          name: "createdOn",
          path: "data.attributes",
          type: "date"
        },
        {
          name: "allowDuplicateName",
          path: "data.attributes",
          type: "boolean"
        }
      ],
      relationships: []
    },
    statusCode: "OK",
    statusCodeValue: 200
  }
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "search-api/search-ws/mapping":
      return MOCK_INDEX_MAPPING_RESP;
  }
});

// Setup API context with the mocked queries.
const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet
    }
  }
};

describe("QueryBuilder component", () => {
  const ReducerProvider = () => {
    const [states, dispatch] = useReducer(
      queryPageReducer,
      INTEGRATION_TEST_INITIAL_STATES
    );

    return (
      <DinaForm initialValues={{ queryRows: [{}], group: "" }}>
        <QueryBuilder name="queryRows" dispatch={dispatch} states={states} />
      </DinaForm>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Displays the Query builder with one Query Row by default.", async () => {
    // Set up test dispatcher.
    const wrapper = mountWithAppContext(<ReducerProvider />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Default row should be present
    expect(wrapper.find(".compoundQueryType0").length).toBe(0);

    expect(
      wrapper.find("SelectField[name='queryRows[0].fieldName']").length
    ).toEqual(1);

    expect(
      wrapper
        .find("SelectField[name='queryRows[0].fieldName']")
        .find(Select)
        .prop("options")
    ).toEqual([
      {
        label: "allowDuplicateName",
        value: "data.attributes.allowDuplicateName"
      },
      {
        label: "createdOn",
        value: "data.attributes.createdOn"
      }
    ]);
  });
  it("Query builder can be used to add rows to aggregate level queries", async () => {
    const wrapper = mountWithAppContext(<ReducerProvider />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // select first row to a date field
    wrapper
      .find("SelectField[name='queryRows[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "data.attributes.createdOn" });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("FaPlus[name='queryRows[0].addRow']").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the boolean dropdown to be visible
    expect(wrapper.find(".compoundQueryType0").length).toBe(0);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("DateField[name='queryRows[0].date']").length).toEqual(
      1
    );
    // set date value
    wrapper
      .find("DateField[name='queryRows[0].date']")
      .find(DatePicker)
      .prop<any>("onChange")(new Date(TEST_SEARCH_DATE));

    // select second row to a boolean field
    wrapper
      .find("SelectField[name='queryRows[1].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "data.attributes.allowDuplicateName" });

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find("SelectField[name='queryRows[1].boolean']").length
    ).toEqual(1);

    // set boolean value
    wrapper
      .find("SelectField[name='queryRows[1].boolean']")
      .find(Select)
      .prop<any>("onChange")("true");
  });
});
