import React from "react";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import { DateField } from "../DateField";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";

/**
 * This test file is specifically designed to test the timezone-related bug
 * where selecting a date in a timezone ahead of UTC (e.g., Australia) would
 * result in the previous day being saved.
 *
 * To reliably test this without flaky environment mocks, we mock the entire
 * `react-datepicker` library. The mock component simulates a user picking a
 * specific problematic date and allows us to assert that our `DateField`'s
 * `onChange` logic handles it correctly.
 *
 * This test file is AI assisted.
 */
function MockDatePicker(props: any) {
  // This function simulates the action of selecting a date from the calendar.
  function simulateDateSelection() {
    // We create a Date object that represents midnight on Oct 15th
    // in a timezone that is AHEAD of UTC (Sydney, UTC+11).
    const problematicDate = new Date("2021-10-15T00:00:00.000+11:00");

    // Call the onChange handler passed down from DateField with this date,
    // exactly as the real DatePicker would. We include a mock event object
    // because the component's logic checks for it.
    if (props.onChange) {
      props.onChange(problematicDate, { type: "click" });
    }
  }

  return (
    <>
      <input
        type="text"
        className="form-control"
        data-testid="date-input"
        value={props.value || ""}
        onChange={(e) => props.onChangeRaw?.(e)}
        onBlur={props.onBlur}
        readOnly={false}
      />
      {/* We'll click this button to trigger our simulated onChange */}
      <button onClick={simulateDateSelection}>Select Date</button>
    </>
  );
}

jest.mock("react-datepicker", () => MockDatePicker);

describe("DateField onChanged Behavior Testing", () => {
  const mockOnSubmit = jest.fn();

  // Helper function to render the component within a form for this suite.
  function getWrapper(testDate: string | null) {
    return mountWithAppContext(
      <DinaForm
        initialValues={{ testField: testDate }}
        onSubmit={(props) => mockOnSubmit(props.submittedValues)}
      >
        <DateField name="testField" />
        <SubmitButton />
      </DinaForm>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits the correct date string when a date is selected in a timezone ahead of UTC", async () => {
    const wrapper = getWrapper("2021-10-10");

    // 1. Find the button we created in our mock and click it.
    // This triggers `simulateDateSelection` which calls the `onChange` handler
    // in the DateField component with the problematic date object.
    fireEvent.click(wrapper.getByRole("button", { name: /Select Date/i }));
    await waitForLoadingToDisappear();

    // 2. Submit the form to check the final value that was stored in Formik's state.
    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitForLoadingToDisappear();

    // The user intended to select "2021-10-15".
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        testField: "2021-10-15"
      });
    });
  });
});
