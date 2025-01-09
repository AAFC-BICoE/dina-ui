import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DateField } from "../DateField";
import { DinaForm } from "../DinaForm";
import { fireEvent } from "@testing-library/react";
import { SubmitButton } from "../SubmitButton";
import "@testing-library/jest-dom";

describe("DateField component", () => {
  const mockOnSubmit = jest.fn();

  function getWrapper(testDate: string | null = "2019-02-02") {
    return mountWithAppContext(
      <DinaForm
        initialValues={{
          testField: testDate
        }}
        onSubmit={(props) => mockOnSubmit(props.submittedValues)}
      >
        <DateField name="testField" partialDate={false} />
        <SubmitButton />
      </DinaForm>
    );
  }

  function getPartialDateWrapper(testDate: string | null = "2019-02-02") {
    return mountWithAppContext(
      <DinaForm
        initialValues={{
          testField: testDate
        }}
      >
        <DateField name="testField" partialDate={true} />
      </DinaForm>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Displays the Formik field's value.", () => {
    const wrapper = getWrapper();

    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "2019-02-02"
    );
  });

  it("Display a null date field as a blank input.", () => {
    const wrapper = getWrapper(null);

    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      ""
    );
  });

  it("Changes the Formik field's value.", () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    fireEvent.change(textbox, { target: { value: "2019-05-25" } });

    expect(textbox.value).toEqual("2019-05-25");
  });

  it("Can set the date field to empty.", async () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    fireEvent.change(textbox, { target: { value: "" } });
    fireEvent.click(wrapper.getByRole("button"));
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({ testField: "" });
  });

  it("Shows an error on non-existing dates.", () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    fireEvent.change(textbox, { target: { value: "2021-02-29" } });
    fireEvent.blur(textbox);

    // Should be displayed twice, at the top of the form and near the text field.
    expect(
      wrapper.getAllByText(/invalid date: 2021\-02\-29/i)[0]
    ).toBeInTheDocument();
    expect(
      wrapper.getAllByText(/invalid date: 2021\-02\-29/i)[1]
    ).toBeInTheDocument();
  });

  it("Partial date on valid formats.", () => {
    const wrapper = getPartialDateWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    // YYYY-MM-DD
    fireEvent.change(textbox, { target: { value: "1998-05-19" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();

    // YYYY-MM
    fireEvent.change(textbox, { target: { value: "1998-05" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();

    // YYYY
    fireEvent.change(textbox, { target: { value: "1998" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
  });

  it("Partial date on invalid formats.", () => {
    const wrapper = getPartialDateWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    // Incorrect month
    fireEvent.change(textbox, { target: { value: "1998-13-19" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();

    // Incorrect day
    fireEvent.change(textbox, { target: { value: "1998-05-43" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();

    // Incorrect year format
    fireEvent.change(textbox, { target: { value: "98" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();

    // Non-supported format
    fireEvent.change(textbox, { target: { value: "September 2019" } });
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();
  });

  it("Shows an error on invalid date formats.", () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(textbox, { target: { value: "2021" } });
    fireEvent.blur(textbox);

    expect(wrapper.queryByRole("status")).toBeInTheDocument();
  });
});
