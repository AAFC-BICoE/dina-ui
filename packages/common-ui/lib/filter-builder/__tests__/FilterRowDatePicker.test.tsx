import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FilterRowDatePicker } from "../FilterRowDatePicker";
import DatePicker from "react-datepicker";

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

    // Passes the selected date as a string to react-datepicker:
    expect(wrapper.find(DatePicker).prop<any>("selected").toString()).toEqual(
      TEST_DATE_VALUE1
    );

    const TEST_SINGLE_DATE_CHANGE =
      "Tue Oct 20 2020 21:05:30 GMT+0000 (Coordinated Universal Time)";

    wrapper.find(DatePicker).prop<any>("onChange")(
      new Date(TEST_SINGLE_DATE_CHANGE)
    );

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

    // Passes the selected dates as a string to react-datepicker:
    expect(
      wrapper.find(DatePicker).at(0).prop<any>("selected").toString()
    ).toEqual(TEST_DATE_VALUE1);
    expect(
      wrapper.find(DatePicker).at(1).prop<any>("selected").toString()
    ).toEqual(TEST_DATE_VALUE2);

    const TEST_LOW_DATE_CHANGE =
      "Tue Oct 20 2020 21:05:30 GMT+0000 (Coordinated Universal Time)";
    const TEST_HIGH_DATE_CHANGE =
      "Sun Oct 25 2020 21:05:30 GMT+0000 (Coordinated Universal Time)";

    // Change the lower date:
    wrapper.find(DatePicker).at(0).prop<any>("onChange")(
      new Date(TEST_LOW_DATE_CHANGE)
    );
    expect(mockOnChanged).lastCalledWith({
      low: TEST_LOW_DATE_CHANGE,
      high: TEST_DATE_VALUE2
    });
    // Change the upper date:
    wrapper.find(DatePicker).at(1).prop<any>("onChange")(
      new Date(TEST_HIGH_DATE_CHANGE)
    );
    expect(mockOnChanged).lastCalledWith({
      low: TEST_DATE_VALUE1,
      high: TEST_HIGH_DATE_CHANGE
    });
  });
});
