import React from "react";
import { mountWithAppContext2 } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { QueryLogicSwitchField } from "../QueryLogicSwitchField";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("QueryLogicSwitchField component", () => {
  it("Displays the field's label value.", () => {
    const wrapper = mountWithAppContext2(
      <DinaForm initialValues={{ testObject: { testField: "and" } }}>
        <QueryLogicSwitchField name="testObject.testField" />
      </DinaForm>
    );
    // Since the input is hidden, you can use `getByDisplayValue` to find it by its value.
    const hiddenInput = screen.getByDisplayValue("and");
    expect(hiddenInput).toHaveValue("and");
  });

  it("Changes the selected query logic will update the submitted value.", async () => {
    const wrapper = mountWithAppContext2(
      <DinaForm initialValues={{ testObject: { testField: "and" } }}>
        <QueryLogicSwitchField name="testObject.testField" />
      </DinaForm>
    );
    // Simulate the click on the OR span (toggle logic switch)
    const orSpan = screen.getByText(/or/i); // Query the "OR" span element
    userEvent.click(orSpan);

    // Wait for the async state change
    await waitFor(() => {
      // Verify the input value was updated to "or"
      const hiddenInput = screen.getByDisplayValue("or");
      expect(hiddenInput).toHaveValue("or");
    });
  });
});
