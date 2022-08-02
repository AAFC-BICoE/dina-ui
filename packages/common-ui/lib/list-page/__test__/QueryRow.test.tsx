import Select from "react-select";
import React from "react";
import { DinaForm } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { QueryRow } from "../QueryRow";
import { ESIndexMapping } from "../types";

const testFieldsOptions: ESIndexMapping[] = [
  {
    label: "testA",
    value: "testA",
    type: "boolean",
    path: "data.attributes",
    distinctTerm: false
  },
  {
    label: "testB",
    value: "testB",
    type: "number",
    path: "data.attributes",
    distinctTerm: false
  },
  {
    label: "testC",
    value: "preparation-type.testC",
    type: "text",
    path: "data.attributes",
    distinctTerm: true
  },
  {
    label: "testD",
    value: "preparation-type.testD",
    type: "text",
    path: "attributes",
    distinctTerm: true,
    parentName: "preparation-type",
    parentPath: "included"
  }
];

describe("QueryRow component", () => {
  it("Displays the Query Row with a dropdown whose items matching the input index mapping fields.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow
          esIndexMapping={testFieldsOptions}
          index={0}
          name="test"
          indexName="testIndex"
        />
      </DinaForm>
    );
    expect(wrapper.find(".compoundQueryType0").length).toBe(0);

    expect(
      wrapper.find("SelectField[name='test[0].fieldName']").length
    ).toEqual(1);
    expect(
      wrapper
        .find("SelectField[name='test[0].fieldName']")
        .find(Select)
        .prop("options")
    ).toEqual([
      {
        label: "Test A",
        value: "testA"
      },
      {
        label: "Test B",
        value: "testB"
      },
      {
        label: "Test C",
        value: "preparation-type.testC"
      },
      {
        label: "Preparation Type",
        options: [
          {
            label: "Test D",
            parentName: "preparation-type",
            value: "preparation-type.testD"
          }
        ]
      }
    ]);
  });

  it("Select a field from fieldName dropdown of query row, the correspondent fields should be set visible.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow
          esIndexMapping={testFieldsOptions}
          index={0}
          name="test"
          indexName="testIndex"
        />
      </DinaForm>
    );

    // Select a boolean type item from the fieldName dropdown
    wrapper
      .find("SelectField[name='test[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({
      value: "testA"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the boolean dropdown to be visible
    expect(wrapper.find("SelectField[name='test[0].boolean']").length).toEqual(
      1
    );
    expect(
      wrapper
        .find("SelectField[name='test[0].boolean']")
        .find(Select)
        .prop<any>("options")
    ).toEqual([
      { label: "TRUE", value: "true" },
      { label: "FALSE", value: "false" }
    ]);

    // Expect the other type dropdown to be invisible
    expect(wrapper.find("SelectField[name='test[0].number']").length).toEqual(
      0
    );
  });
});
