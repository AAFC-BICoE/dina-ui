import Select from "react-select";
import React from "react";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import DatePicker from "react-datepicker";

const TEST_SEARCH_DATE =
  "Fri Jan 21 2022 21:05:30 GMT+0000 (Coordinated Universal Time)";

const INDEX_NAME = "DINA_EXAMPLE_INDEX";

/** Options array based on resources returned by elastic search mapping from api. */
const MOCK_INDEX_MAPPING_RESP = {
  data: {
    indexName: INDEX_NAME,
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
    relationships: [
      {
        referencedBy: "collectingEvent",
        name: "type",
        path: "included",
        value: "collecting-event",
        attributes: [
          {
            name: "createdBy",
            type: "text",
            path: "attributes"
          },
          {
            name: "createdOn",
            type: "date",
            path: "attributes"
          },
          {
            name: "dwcOtherRecordNumbers",
            type: "text",
            path: "attributes"
          },
          {
            name: "dwcRecordNumber",
            type: "text",
            path: "attributes"
          }
        ]
      },
      {
        referencedBy: "preparationMethod",
        name: "type",
        path: "included",
        value: "preparation-method",
        attributes: [
          {
            name: "name",
            type: "text",
            path: "attributes",
            distinct_term_agg: true
          }
        ]
      }
    ]
  }
};

const mockGet = jest.fn<any, any>(async (path) => {
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Query builder options from index are displayed correctly.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ queryRows: [{}], group: "" }}>
        <QueryBuilder
          name="queryRows"
          indexName={INDEX_NAME}
          onGroupChange={() => null}
        />
      </DinaForm>,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find("SelectField[name='queryRows[0].fieldName']")
        .find(Select)
        .prop("options")
    ).toEqual([
      {
        label: "Allow Duplicate Name",
        value: "data.attributes.allowDuplicateName"
      },
      {
        label: "Created On",
        value: "data.attributes.createdOn"
      },
      {
        label: "Collecting Event",
        options: [
          {
            label: "Created By",
            parentName: "collectingEvent",
            value: "collecting-event.createdBy"
          },
          {
            label: "Created On",
            parentName: "collectingEvent",
            value: "collecting-event.createdOn"
          },
          {
            label: "Dwc Other Record Numbers",
            parentName: "collectingEvent",
            value: "collecting-event.dwcOtherRecordNumbers"
          },
          {
            label: "Dwc Record Number",
            parentName: "collectingEvent",
            value: "collecting-event.dwcRecordNumber"
          }
        ]
      },
      {
        label: "Preparation Method",
        options: [
          {
            label: "Name",
            parentName: "preparationMethod",
            value: "preparation-method.name"
          }
        ]
      }
    ]);
  });

  it("Displays the Query builder with one Query Row by default.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ queryRows: [{}], group: "" }}>
        <QueryBuilder
          name="queryRows"
          indexName={INDEX_NAME}
          onGroupChange={() => null}
        />
      </DinaForm>,
      {
        apiContext
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Default row should be present
    expect(wrapper.find(".compoundQueryType0").length).toBe(0);

    expect(
      wrapper.find("SelectField[name='queryRows[0].fieldName']").length
    ).toEqual(1);
  });

  it("Query builder can be used to add rows to aggregate level queries", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ queryRows: [{}] }}>
        <QueryBuilder
          name="queryRows"
          indexName={INDEX_NAME}
          onGroupChange={() => null}
        />
      </DinaForm>,
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
