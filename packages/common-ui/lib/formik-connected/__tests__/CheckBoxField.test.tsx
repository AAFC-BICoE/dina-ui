import React from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { CheckBoxField } from "../CheckBoxField";
import { DinaForm } from "../DinaForm";

describe("CheckBoxField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: false } }}>
        <CheckBoxField name="testObject.testField" />
      </DinaForm>
    );
    expect(wrapper.find("label").text()).toEqual("Test Object Test Field");
    expect((wrapper.find("input").instance() as any).checked).toEqual(true);
  });

  it("Changes the field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: false } }}>
        <CheckBoxField name="testObject.testField" />
      </DinaForm>
    );

    wrapper.find("input").simulate("change", {
      target: { name: "testObject.testField", checked: true }
    });
    expect((wrapper.find("input").instance() as any).checked).toEqual(true);
    expect((wrapper.find("input").instance() as any).value).toEqual("true");
  });
});
