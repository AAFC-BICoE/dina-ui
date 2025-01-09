import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FormattedTextField } from "../FormattedTextField";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("FormattedTextField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "2020" } }}>
        <FormattedTextField name="testObject.testField" />
      </DinaForm>
    );
    expect(wrapper.container.querySelector("label")?.textContent).toEqual(
      "Test Object Test Field"
    );
    expect(
      wrapper.container.querySelector("input")?.getAttribute("value")
    ).toEqual("2020");
  });

  it("Changes the field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "2020" } }}>
        {({
          values: {
            testObject: { testField }
          }
        }) => (
          <>
            <FormattedTextField name="testObject.testField" />
            <div className="value-display">{testField}</div>
          </>
        )}
      </DinaForm>
    );

    // Simulate changing the input value to "201912"
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /test object test field/i
      }),
      { target: { value: "201912" } }
    );

    // Check if the displayed value is updated to "2019-12"
    expect(
      wrapper.container.querySelector(".value-display")?.textContent
    ).toEqual("2019-12");

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /test object test field/i
      }),
      { target: { value: "2019we" } }
    );
    expect(
      wrapper.container.querySelector(".value-display")?.textContent
    ).toEqual("2019");
  });
});
