import { FastField, FieldProps } from "formik";
import { noop } from "lodash";
import Select from "react-select";
import { Styles } from "react-select/src/styles";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface SelectFieldProps extends LabelWrapperParams {
  disabled?: boolean;
  onChange?: (value?: string) => void;
  options: any[];
  styles?: Partial<Styles>;
}

/** Formik-connected select input. */
export function SelectField(props: SelectFieldProps) {
  const {
    disabled,
    onChange = noop,
    options,
    styles,
    ...labelWrapperProps
  } = props;
  const { name } = labelWrapperProps;

  return (
    <FastField name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChangeInternal({ value: newValue }) {
          setFieldValue(name, newValue);
          setFieldTouched(name);
          onChange(newValue);
        }

        return (
          <FieldWrapper {...labelWrapperProps}>
            <Select
              isDisabled={disabled}
              options={options}
              onChange={onChangeInternal}
              styles={styles}
              value={options.find(option => option.value === value)}
            />
          </FieldWrapper>
        );
      }}
    </FastField>
  );
}
