import { fireEvent } from "@testing-library/react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import { TextField } from "../TextField";
import { object, string } from "yup";
import "@testing-library/jest-dom";

describe("TextField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "initial value" } }}>
        <TextField name="testObject.testField" />
      </DinaForm>
    );

    expect(wrapper.getByText(/test object test field/i)).toBeInTheDocument();
    expect(
      (
        wrapper.getByRole("textbox", {
          name: /test object test field/i
        }) as HTMLInputElement
      ).value
    ).toEqual("initial value");
  });

  it("Changes the field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "initial value" } }}>
        {({
          values: {
            testObject: { testField }
          }
        }) => (
          <>
            <TextField name="testObject.testField" />
            <div id="value-display">{testField}</div>
          </>
        )}
      </DinaForm>
    );

    fireEvent.change(wrapper.getByRole("textbox"), {
      target: { name: "testObject.testField", value: "new value" }
    });
    expect(
      (
        wrapper.getByRole("textbox", {
          name: /test object test field/i
        }) as HTMLInputElement
      ).value
    ).toEqual("new value");
  });

  it("Shows a field-level error message.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ testField: "initial value" }}
        validationSchema={object({
          testField: string().test({
            message: "Test Error",
            test: () => false
          })
        })}
      >
        <TextField name="testField" />
        <SubmitButton />
      </DinaForm>
    );

    fireEvent.click(wrapper.getByRole("button"));
    await new Promise(setImmediate);
    expect(
      wrapper.getByText(/1 : test field \- test error/i)
    ).toBeInTheDocument();
  });
});
