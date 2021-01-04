import { FastField, FieldProps } from "formik";
import DatePicker from "react-datepicker";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export type EventDateDisplayType = "Y" | "Y-M" | "Y-M-D" | "Y-M-D-T";

export interface DateFieldProps {
  showTime?: boolean;
  disabled?: boolean;
  displayType?: EventDateDisplayType;
}

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams & DateFieldProps) {
  const { name, showTime, disabled, displayType } = props;

  return (
    <FieldWrapper {...props}>
      <FastField name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          function onChange(date: Date) {
            if (showTime || displayType === "Y-M-D-T") {
              setFieldValue(
                name,
                date &&
                  date.toISOString().slice(0, date.toISOString().length - 2)
              );
            } else if (displayType === "Y-M-D") {
              setFieldValue(name, date && date.toISOString().slice(0, 10));
            } else if (displayType === "Y-M") {
              setFieldValue(name, date && date.toISOString().slice(0, 7));
            } else if (displayType === "Y") {
              setFieldValue(name, date && date.toISOString().slice(0, 4));
            }
            setFieldTouched(name);
          }

          return (
            <div>
              <DatePicker
                className="form-control"
                wrapperClassName="w-100"
                dateFormat={
                  showTime || displayType === "Y-M-D-T"
                    ? "Pp"
                    : displayType === "Y-M-D"
                    ? "yyyy-MM-dd"
                    : displayType === "Y-M"
                    ? "yyyy-MM"
                    : displayType === "Y"
                    ? "yyyy"
                    : "yyyy-MM-dd"
                }
                isClearable={!disabled}
                showFullMonthYearPicker={false}
                showMonthDropdown={false}
                showMonthYearDropdown={displayType === "Y-M"}
                showMonthYearPicker={displayType === "Y-M"}
                onChange={onChange}
                selected={
                  value
                    ? showTime || displayType === "Y-M-D-T"
                      ? new Date(`${value}`)
                      : new Date(`${value}T12:00:00Z`)
                    : null
                }
                showTimeSelect={showTime || displayType === "Y-M-D-T"}
                showYearDropdown={displayType === "Y"}
                showYearPicker={displayType === "Y"}
                todayButton="Today"
                disabled={disabled}
              />
            </div>
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
