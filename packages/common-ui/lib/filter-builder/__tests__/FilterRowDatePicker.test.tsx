import { mountWithAppContext } from "common-ui";
import { FilterRowDatePicker } from "../FilterRowDatePicker";
import { fireEvent } from "@testing-library/react";

// The state to pass in to the datepicker:
const TEST_DATE_VALUE1 =
  "Mon Oct 12 2020 21:05:30 GMT+0000 (Coordinated Universal Time)";
const TEST_DATE_VALUE2 =
  "Thu Oct 15 2020 21:05:30 GMT+0000 (Coordinated Universal Time)";

// Mocks the "today" date:
const TEST_DEFAULT_DATE = new Date(
  "Sat Oct 17 2020 21:05:30 GMT+0000 (Coordinated Universal Time)"
);

describe("FilterRowDatePicker", () => {
  it("Renders the single date picker.", async () => {
    const mockOnChanged = jest.fn();
    const wrapper = mountWithAppContext(
      <FilterRowDatePicker
        defaultDate={() => TEST_DEFAULT_DATE}
        isRange={false}
        onDateValueChanged={mockOnChanged}
        value={TEST_DATE_VALUE1}
      />
    );

    await new Promise(setImmediate);

    const datepicker = wrapper.getByRole("textbox") as HTMLInputElement;
    expect(datepicker.value).toEqual("10/12/2020"); // User friendly version.

    const TEST_SINGLE_DATE_CHANGE =
      "Tue Oct 20 2020 21:05:30 GMT+0000 (Coordinated Universal Time)";

    fireEvent.change(datepicker, { target: { value: "10/20/2020" } });
    expect(mockOnChanged).lastCalledWith(TEST_SINGLE_DATE_CHANGE);
  });

  it("Renders the date range picker.", async () => {
    const mockOnChanged = jest.fn();
    const wrapper = mountWithAppContext(
      <FilterRowDatePicker
        defaultDate={() => TEST_DEFAULT_DATE}
        isRange={true}
        onDateValueChanged={mockOnChanged}
        value={{ low: TEST_DATE_VALUE1, high: TEST_DATE_VALUE2 }}
      />
    );

    await new Promise(setImmediate);
    const datepickers = wrapper.getAllByRole("textbox") as HTMLInputElement[];

    // Passes the selected dates as a string to react-datepicker:
    fireEvent.change(datepickers[0], { target: { value: "10/20/2020" } });
    await new Promise(setImmediate);
    expect(mockOnChanged).lastCalledWith({
      high: "Thu Oct 15 2020 21:05:30 GMT+0000 (Coordinated Universal Time)",
      low: "Tue Oct 20 2020 21:05:30 GMT+0000 (Coordinated Universal Time)"
    });

    fireEvent.change(datepickers[1], { target: { value: "10/25/2020" } });
    await new Promise(setImmediate);
    expect(mockOnChanged).lastCalledWith({
      high: "Sun Oct 25 2020 21:05:30 GMT+0000 (Coordinated Universal Time)",
      low: "Mon Oct 12 2020 21:05:30 GMT+0000 (Coordinated Universal Time)"
    });
  });
});
