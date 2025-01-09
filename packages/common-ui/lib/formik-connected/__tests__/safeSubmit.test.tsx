import { Form, Formik } from "formik";
import { DoOperationsError } from "../..";
import { mountWithAppContext } from "common-ui";
import { ErrorViewer } from "../ErrorViewer";
import { OnFormikSubmit, safeSubmit } from "../safeSubmit";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function getWrapper(customOnSubmit: OnFormikSubmit) {
  const onSubmit = safeSubmit(customOnSubmit);

  return mountWithAppContext(
    <Formik initialValues={{ testProperty: "testValue" }} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
      </Form>
    </Formik>
  );
}

describe("safeSubmit function", () => {
  it("Calls the provided submit function.", async () => {
    const onSubmit = jest.fn();

    const wrapper = getWrapper(onSubmit);

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for async operations to complete
    await new Promise(setImmediate);

    // The submit function is called with the form values and the FormikActions object.
    expect(onSubmit).toHaveBeenCalledWith(
      { testProperty: "testValue" },
      expect.objectContaining({ setStatus: expect.anything() })
    );
  });

  it("Sets the form error message if the submit function throws an error.", async () => {
    const wrapper = getWrapper(() => {
      throw new Error("Test error message");
    });

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for async operations to complete
    await new Promise(setImmediate);

    // Use querySelector to check for the error message
    const errorMessage = wrapper.container.querySelector(".alert.alert-danger");
    expect(errorMessage).toBeInTheDocument(); // Ensure the error message is in the document
    expect(errorMessage?.textContent).toEqual("Test error message");
  });

  it("Sets the form error message and the field errors..", async () => {
    const wrapper = getWrapper(() => {
      throw new DoOperationsError("Test error message", {
        fieldA: "must be a number",
        fieldB: "must be set"
      });
    });

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for async operations to complete
    await new Promise(setImmediate);

    // Use querySelector to get error messages
    const errorMessages = wrapper.container.querySelectorAll(".error-message");
    const errorTexts = Array.from(errorMessages).map(
      (node) => node.textContent
    );

    expect(errorTexts).toEqual([
      "Test error message",
      "1 : Field A - must be a number",
      "2 : Field B - must be set"
    ]);
  });

  it("Sets no error message when none are thrown by the form submission.", async () => {
    const wrapper = getWrapper(() => {
      throw new DoOperationsError("", {});
    });

    // Use querySelector to find the form and simulate submit
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for async operations to complete
    await new Promise(setImmediate);

    // Use querySelector to get error messages
    const errorMessages = wrapper.container.querySelectorAll(".error-message");
    const errorTexts = Array.from(errorMessages).map(
      (node) => node.textContent
    );

    expect(errorTexts).toEqual([]);
  });
});
