import { Field, FieldProps } from "formik";
import DatePicker from "react-datepicker";
import { LabelWrapperParams } from "./FieldWrapper";

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams) {
  const { name } = props;

  return (
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
            selected={value ? new Date(`${value}`) : null}
            showYearDropdown={true}
            todayButton="Today"
            showTimeSelect={true}
            dateFormat="Pp"
          />
        );
      }}
    </Field>
  );
}
