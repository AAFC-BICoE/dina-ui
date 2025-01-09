import React from "react";
import { mountWithAppContext } from "common-ui";
import { CheckBoxField } from "../CheckBoxField";
import { DinaForm } from "../DinaForm";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("CheckBoxField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: false } }}>
        <CheckBoxField name="testObject.testField" />
      </DinaForm>
    );

    expect(wrapper.queryByText(/test object test field/i)).toBeInTheDocument();
    expect(
      (
        wrapper.getByRole("checkbox", {
          name: /test object test field/i
        }) as HTMLInputElement
      ).checked
    ).toEqual(false);
  });

  it("Changes the field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: false } }}>
        <CheckBoxField name="testObject.testField" />
      </DinaForm>
    );

    fireEvent.change(
      wrapper.getByRole("checkbox", {
        name: /test object test field/i
      }) as HTMLInputElement,
      {
        target: { name: "testObject.testField", checked: true }
      }
    );
    expect(
      (
        wrapper.getByRole("checkbox", {
          name: /test object test field/i
        }) as HTMLInputElement
      ).checked
    ).toEqual(true);
  });
});
