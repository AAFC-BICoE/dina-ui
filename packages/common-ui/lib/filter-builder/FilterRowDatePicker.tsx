import _ from "lodash";
import { useEffect } from "react";
import DatePicker from "react-datepicker";

export interface DateRange {
  low: string;
  high: string;
}

export interface FilterRowDatePickerProps {
  isRange: boolean;
  value: string | DateRange;
  onDateValueChanged: (date: string | DateRange | null) => void;
  defaultDate?: () => Date;
}

/** Single-date and date-range picker for the FilterRow. */
export function FilterRowDatePicker({
  defaultDate = () => new Date(),
  isRange,
  onDateValueChanged,
  value
}: FilterRowDatePickerProps) {
  // Set a default value when the user switches between single-date and range inputs:
  useEffect(() => {
    const today = defaultDate().toString();
    // Init default DateRange:
    if (isRange && !_.isPlainObject(value)) {
      onDateValueChanged({ low: today, high: today });
    }
    // Init default single date string:
    if (!isRange && typeof value !== "string") {
      onDateValueChanged(today);
    }
  }, [isRange]);

  if (isRange && _.isPlainObject(value) && typeof value !== "string") {
    const { high, low } = value;

    return (
      <>
        <div className="list-inline-item" style={{ width: "14rem" }}>
          <DatePicker
            className="d-inline-block form-control"
            wrapperClassName="w-100"
            selected={new Date(low)}
            onChange={(date) =>
              date && onDateValueChanged({ ...value, low: date.toString() })
            }
          />
        </div>
        <div className="list-inline-item" style={{ width: "14rem" }}>
          <DatePicker
            className="d-inline-block form-control"
            wrapperClassName="w-100"
            selected={new Date(high)}
            onChange={(date) =>
              date && onDateValueChanged({ ...value, high: date.toString() })
            }
          />
        </div>
      </>
    );
  } else {
    const selected =
      typeof value === "string"
        ? isNaN(Date.parse(value))
          ? defaultDate()
          : new Date(value)
        : null;

    return (
      <>
        <div className="list-inline-item" style={{ width: "16rem" }}>
          <DatePicker
            className="d-inline-block form-control"
            wrapperClassName="w-100"
            selected={selected}
            onChange={(date) => onDateValueChanged(date && date.toString())}
          />
        </div>
        <div className="list-inline-item" style={{ width: "12rem" }} />
      </>
    );
  }
}
