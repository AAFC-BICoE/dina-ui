import { Field, FieldProps } from "formik";
import Select from "react-select";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export interface SelectFieldProps extends LabelParams {
  options: any[];
}

export function SelectField(props: SelectFieldProps) {
  const { className, name, label, options } = props;

  return (
    <Field name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange({ value: selectValue }) {
          setFieldValue(name, selectValue);
          setFieldTouched(name);
        }

        return (
          <FieldWrapper className={className} name={name} label={label}>
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
