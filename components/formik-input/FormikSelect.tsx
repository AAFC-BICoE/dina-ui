import { Field, FieldProps } from "formik";
import Select from "react-select";

export interface FormikSelectProps {
  field: string;
  options: any[];
}

export function FormikSelect({ field, options }: FormikSelectProps) {
  function InnerInput({
    field: { value },
    form: { setFieldValue, setFieldTouched }
  }: FieldProps) {
    function onChange({ value: selectValue }) {
      setFieldValue(field, selectValue);
      setFieldTouched(field);
    }

    return (
      <Select
        options={options}
        onChange={onChange}
        value={options.find(option => option.value === value)}
      />
    );
  }

  return <Field name={field} component={InnerInput} />;
}
