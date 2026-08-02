import React from "react";
import { mountWithAppContext } from "common-ui";
import { CheckBoxField } from "../CheckBoxField";
import { DinaForm } from "../DinaForm";
import userEvent from "@testing-library/user-event";
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

  it("Changes the field's value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: false } }}>
        <CheckBoxField name="testObject.testField" />
      </DinaForm>
    );

    await userEvent.click(
      wrapper.getByRole("checkbox", {
        name: /test object test field/i
      }) as HTMLInputElement
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
