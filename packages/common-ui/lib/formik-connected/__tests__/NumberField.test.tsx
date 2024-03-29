import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { NumberField } from "../NumberField";

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
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });

    expect(wrapper.find("label").text()).toEqual("Test Field");
    expect((wrapper.find("input").instance() as any).value).toEqual("123.23");
  });

  it("Changes the field's value.", async () => {
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });

    // Change the value.
    wrapper.find("input").simulate("change", { target: { value: "456.78" } });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    // Expect the correct value to have been submitted.
    expect(mockOnSubmit).lastCalledWith({ testField: "456.78" });
  });

  it("Sets the field value as null if the input is blank.", async () => {
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });

    // Change the value to blank.
    wrapper.find("input").simulate("change", { target: { value: "" } });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    // Expect the correct value to have been submitted.
    expect(mockOnSubmit).lastCalledWith({ testField: null });
  });

  it("Shows a blank input when the formik value is undefined.", async () => {
    const wrapper = getWrapper({ initialValues: {} });
    expect(wrapper.find("input").prop("value")).toEqual("");
  });

  it("Shows a blank input when the formik value becomes blank.", async () => {
    const wrapper = getWrapper({ initialValues: { testField: 123.23 } });
    expect(wrapper.find("input").prop("value")).toEqual(123.23);

    // Change the value to undefined.
    wrapper.find("input").simulate("change", { target: { value: "" } });
    wrapper.update();

    // The input should become blank.
    expect(wrapper.find("input").prop("value")).toEqual("");

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    // Expect the correct value to have been submitted.
    expect(mockOnSubmit).lastCalledWith({ testField: null });
  });
});
