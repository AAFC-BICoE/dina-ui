import { clearAndType, mountWithAppContext } from "common-ui";
import { DateField } from "../DateField";
import { DinaForm } from "../DinaForm";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  // Helper function for the new test cases with showTime enabled.
  function getTimeWrapper(testDate: string | null = null) {
    return mountWithAppContext(
      <DinaForm
        initialValues={{ testField: testDate }}
        onSubmit={(props) => mockOnSubmit(props.submittedValues)}
      >
        <DateField name="testField" showTime={true} />
        <SubmitButton />
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

  it("Changes the Formik field's value.", async () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    await clearAndType(textbox, "2019-05-25");

    expect(textbox.value).toEqual("2019-05-25");
  });

  it("Can set the date field to empty.", async () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    await userEvent.clear(textbox);
    // Close the date-picker popup so the blur is not swallowed by it.
    await userEvent.keyboard("{Escape}");
    await userEvent.click(wrapper.getByRole("button"));
    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({ testField: "" });
    });
  });

  it("Shows an error on non-existing dates.", async () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    await clearAndType(textbox, "2021-02-29");
    // Close the date-picker popup so the blur is not swallowed by it.
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);

    // Should be displayed twice, at the top of the form and near the text field.
    expect(
      wrapper.getAllByText(/invalid date: 2021\-02\-29/i)[0]
    ).toBeInTheDocument();
    expect(
      wrapper.getAllByText(/invalid date: 2021\-02\-29/i)[1]
    ).toBeInTheDocument();
  });

  it("Partial date on valid formats.", async () => {
    const wrapper = getPartialDateWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    // YYYY-MM-DD
    await clearAndType(textbox, "1998-05-19");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();

    // YYYY-MM
    await clearAndType(textbox, "1998-05");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();

    // YYYY
    await clearAndType(textbox, "1998");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
  });

  it("Partial date on invalid formats.", async () => {
    const wrapper = getPartialDateWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    // Incorrect month
    await clearAndType(textbox, "1998-13-19");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();

    // Incorrect day
    await clearAndType(textbox, "1998-05-43");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();

    // Incorrect year format
    await clearAndType(textbox, "98");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();

    // Non-supported format
    await clearAndType(textbox, "September 2019");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);
    expect(wrapper.queryByRole("status")).toBeInTheDocument();
  });

  it("Shows an error on invalid date formats.", async () => {
    const wrapper = getWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;
    await clearAndType(textbox, "2021");
    await userEvent.keyboard("{Escape}");
    fireEvent.blur(textbox);

    expect(wrapper.queryByRole("status")).toBeInTheDocument();
  });

  it("Correctly formats a manually typed date on blur when showTime is enabled.", async () => {
    const wrapper = getTimeWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    // Manually type a date without time.
    await clearAndType(textbox, "2018-01-03");

    // Close the date-picker popup so the blur is not swallowed by it.
    await userEvent.keyboard("{Escape}");

    // When the field loses focus, it should reformat.
    fireEvent.blur(textbox);

    // The date-picker's display format will update visually.
    await waitFor(() => {
      expect(textbox.value).toEqual("01/03/2018, 12:00 AM");
    });

    // Check that the submitted value is a full ISO string.
    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({
        testField: expect.stringMatching(
          /^2018-01-03T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        )
      });
    });
  });

  it("Shows an error for an invalid date format when showTime is enabled.", async () => {
    const wrapper = getTimeWrapper();
    const textbox = wrapper.getByRole("textbox") as HTMLInputElement;

    // Type an invalid date string.
    await clearAndType(textbox, "this-is-not-a-date");
    fireEvent.blur(textbox);
    // Close the date-picker popup, which blurs the input with the typed text.
    await userEvent.keyboard("{Escape}");

    // An error message should be displayed.
    await waitFor(() => {
      expect(
        wrapper.getAllByText(/invalid date: this-is-not-a-date/i)
      ).toHaveLength(2);
    });

    // Ensure form submission is not triggered with the invalid value.
    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
