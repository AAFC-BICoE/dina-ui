import React from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { QueryLogicSwitchField } from "../QueryLogicSwitchField";

describe("QueryLogicSwitchField component", () => {
  it("Displays the field's label value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "and" } }}>
        <QueryLogicSwitchField name="testObject.testField" />
      </DinaForm>
    );
    expect(wrapper.find("input").prop("value")).toEqual("and");
  });

  it("Changes the selected query logic will update the submitted value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "and" } }}>
        <QueryLogicSwitchField name="testObject.testField" />
      </DinaForm>
    );
    wrapper.find("span.orSpan").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("input").prop("value")).toEqual("or");
  });
});
