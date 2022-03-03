import Select from "react-select";
import React from "react";
import { DinaForm } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ESIndexMapping, QueryRow } from "../QueryRow";

const testFieldsOptions: ESIndexMapping[] = [
  { label: "testA", value: "testA", type: "boolean", path: "data.attributes" },
  { label: "testB", value: "testB", type: "number", path: "data.attributes" }
];

describe("QueryRow component", () => {
  it("Displays the Query Row with a dropdown whose items matching the input index mapping fields.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow esIndexMapping={testFieldsOptions} index={0} name="test" />
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
        label: "testA",
        value: "testA(boolean)"
      },
      {
        label: "testB",
        value: "testB(number)"
      }
    ]);
  });
  it("Select a field from fieldName dropdown of query row, the correspondant fields should be set visible.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow esIndexMapping={testFieldsOptions} index={0} name="test" />
      </DinaForm>
    );

    // Select a boolean type item from the fieldName dropdown
    wrapper
      .find("SelectField[name='test[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({
      value: "testA(boolean)"
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
