import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { NumberField } from "../NumberField";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";

const mockOnSubmit = jest.fn();

function getWrapper({ initialValues }) {
  return mountWithAppContext(
    <DinaForm
      initialValues={initialValues}
      onSubmit={async ({ submittedValues }) => mockOnSubmit(submittedValues)}
    >
      <NumberField name="testField" />
    </DinaForm>
  );
}

describe("NumberField component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Displays the field's label and value.", async () => {
    getWrapper({ initialValues: { testField: 123.23 } });

    // Assert the label text
    expect(screen.getByLabelText("Test Field")).toBeInTheDocument();

    // Assert the input value
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("123.23");
  });

  it("Changes the field's value.", async () => {
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });

    // Change the value of the input field.
    const input = screen.getByLabelText("Test Field");
    fireEvent.change(input, { target: { value: "456.78" } });

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the submission to complete
    await waitFor(() => {
      // Expect the correct value to have been submitted
      expect(mockOnSubmit).toHaveBeenLastCalledWith({ testField: "456.78" });
    });
  });

  it("Sets the field value as null if the input is blank.", async () => {
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });

    // Change the value to blank.
    const input = screen.getByLabelText("Test Field");
    fireEvent.change(input, { target: { value: "" } });

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the submission to complete
    await waitFor(() => {
      // Expect the correct value to have been submitted
      expect(mockOnSubmit).toHaveBeenLastCalledWith({ testField: null });
    });
  });

  it("Shows a blank input when the formik value is undefined.", async () => {
    getWrapper({ initialValues: {} });
    // Assert the input value
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("Submits blank input when the formik value is changed to blank.", async () => {
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });
    // Assert the input value
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("123.23");

    // Change the value to undefined.
    fireEvent.change(input, { target: { value: "" } });

    // The input should become blank.
    expect(input).toHaveValue("");

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Expect the correct value to have been submitted.
    // Wait for the submission to complete
    await waitFor(() => {
      // Expect the correct value to have been submitted
      expect(mockOnSubmit).toHaveBeenLastCalledWith({ testField: null });
    });
  });
});
