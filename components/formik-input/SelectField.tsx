import { Field, FieldProps } from "formik";
import Select from "react-select";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export interface SelectFieldProps extends LabelParams {
  options: any[];
}

export function SelectField(props: SelectFieldProps) {
  const { className, field, label, options } = props;

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
          <FieldWrapper className={className} field={field} label={label}>
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
