import Select from "react-select";
import React from "react";
import { DinaForm, QueryBuilder } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import DatePicker from "react-datepicker";

const TEST_SEARCH_DATE =
  "Fri Jan 21 2022 21:05:30 GMT+0000 (Coordinated Universal Time)";

/** Mock resources returned by elastic search mapping from api. */
const MOCK_INDEX_MAPPING_RESP = {
  data: {
    "data.id.": "text",
    "data.attributes.createdOn": "date",
    "meta.moduleVersion": "text",
    "data.attributes.allowDuplicateName": "boolean"
  }
};

const mockSearchApiGet = jest.fn(async () => {
  return MOCK_INDEX_MAPPING_RESP;
});

const apiContext = {
  apiClient: {
    axios: { get: mockSearchApiGet } as any
  }
} as any;

describe("QueryBuilder component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Displays the Query builder with one Query Row by default.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ queryRows: [{}] }}>
        <QueryBuilder indexName="testIndex" name={"queryRows"} />
      </DinaForm>,
      { apiContext }
    );

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
        label: "createdOn",
        value: "data.attributes.createdOn(date)"
      },
      {
        label: "allowDuplicateName",
        value: "data.attributes.allowDuplicateName(boolean)"
      }
    ]);
  });
  it("Query builder can be used to add rows to aggretate level queries", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ queryRows: [{}] }}>
        <QueryBuilder indexName="testIndex" name="queryRows" />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();
    wrapper.find("FaPlus[name='queryRows[0].addRow']").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the boolean dropdown to be visible
    expect(wrapper.find(".compoundQueryType0").length).toBe(0);

    // select first row to a date field
    wrapper
      .find("SelectField[name='queryRows[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({ value: "createdOn(date)" });

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
      .prop<any>("onChange")("true");
  });
});
