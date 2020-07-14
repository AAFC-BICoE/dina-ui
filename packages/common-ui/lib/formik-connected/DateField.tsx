import { FastField, FieldProps } from "formik";
import DatePicker from "react-datepicker";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface DateFieldProps {
  showTime?: boolean;
  disabled?: boolean;
}

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams & DateFieldProps) {
  const { name, showTime, disabled } = props;

  return (
    <FieldWrapper {...props}>
      <FastField name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          function onChange(date: Date) {
            if (showTime) {
              setFieldValue(name, date && date.toISOString());
            } else {
              setFieldValue(name, date && date.toISOString().slice(0, 10));
            }
            setFieldTouched(name);
          }

          return (
            <div>
              <DatePicker
                className="form-control"
                dateFormat={showTime ? "Pp" : "yyyy-MM-dd"}
                isClearable={true}
                onChange={onChange}
                selected={
                  value
                    ? showTime
                      ? new Date(`${value}`)
                      : new Date(`${value}T12:00:00Z`)
                    : null
                }
                showTimeSelect={showTime}
                showYearDropdown={true}
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
