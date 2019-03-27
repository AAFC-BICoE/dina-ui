import { Field, FieldProps } from "formik";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams) {
  const { className, name, label } = props;

  return (
    <FieldWrapper className={className} name={name} label={label}>
      <Field name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          function onChange(date: Date) {
            setFieldValue(name, date && date.toISOString());
            setFieldTouched(name);
          }

          return (
            <DatePicker
              className="form-control"
              isClearable={true}
              onChange={onChange}
              selected={value ? new Date(value) : null}
              todayButton="Today"
            />
          );
        }}
      </Field>
    </FieldWrapper>
  );
}
