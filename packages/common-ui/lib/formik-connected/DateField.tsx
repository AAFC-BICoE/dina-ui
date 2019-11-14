import { Field, FieldProps } from "formik";
import DatePicker from "react-datepicker";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface DateFieldProps {
  showTime?: boolean;
}

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams & DateFieldProps) {
  const { name, showTime } = props;

  return (
    <FieldWrapper {...props}>
      <Field name={name}>
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
            <DatePicker
              className="form-control"
              isClearable={true}
              onChange={onChange}
              selected={
                value
                  ? showTime
                    ? new Date(`${value}`)
                    : new Date(`${value}T12:00:00Z`)
                  : null
              }
              showYearDropdown={true}
              todayButton="Today"
              showTimeSelect={showTime}
              dateFormat={showTime ? "Pp" : "yyyy-MM-dd"}
            />
          );
        }}
      </Field>
    </FieldWrapper>
  );
}
