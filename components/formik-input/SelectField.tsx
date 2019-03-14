import { Field, FieldProps } from "formik";
import Select from "react-select";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export interface FormikSelectProps extends LabelParams {
  options: any[];
}

export function FormikSelect(props: FormikSelectProps) {
  const { field, options } = props;

  return (
    <Field name={field}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange({ value: selectValue }) {
          setFieldValue(field, selectValue);
          setFieldTouched(field);
        }

        return (
          <FieldWrapper {...props}>
            <Select
              options={options}
              onChange={onChange}
              value={options.find(option => option.value === value)}
            />
          </FieldWrapper>
        );
      }}
    </Field>
  );
}
