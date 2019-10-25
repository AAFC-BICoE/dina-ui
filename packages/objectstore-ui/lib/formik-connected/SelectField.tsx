import { Field, FieldProps } from "formik";
import { noop } from "lodash";
import Select from "react-select";
import { LabelWrapperParams } from "./FieldWrapper";

export interface SelectFieldProps extends LabelWrapperParams {
  onChange?: (value?: string) => void;
  options: any[];
  tooltipMsg?: string;
}

/** Formik-connected select input. */
export function SelectField({
  name,
  onChange = noop,
  options
}: SelectFieldProps) {
  return (
    <Field name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChangeInternal({ value: selectValue }) {
          setFieldValue(name, selectValue);
          setFieldTouched(name);
          onChange(selectValue);
        }

        return (
          <Select
            options={options}
            onChange={onChangeInternal}
            value={options.find(option => option.value === value)}
          />
        );
      }}
    </Field>
  );
}
