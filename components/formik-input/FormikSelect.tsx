import { Field, FieldProps } from "formik";
import Select from "react-select";

export interface FormikSelectProps {
  field: string;
  options: any[];
}

export function FormikSelect({ field, options }: FormikSelectProps) {
  const InnerInput = ({
    field: { value },
    form: { setFieldValue }
  }: FieldProps) => (
    <Select
      options={options}
      onChange={({ value }) => setFieldValue(field, value)}
      value={options.find(option => option.value === value)}
    />
  );

  return <Field name={field} component={InnerInput} />;
}
