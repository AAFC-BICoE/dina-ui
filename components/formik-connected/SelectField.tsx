import { FastField, FieldProps } from "formik";
import { noop } from "lodash";
import Select from "react-select";
import { Styles } from "react-select/lib/styles";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface SelectFieldProps extends LabelWrapperParams {
  onChange?: (value?: string) => void;
  options: any[];
  tooltipMsg?: string;
  styles?: Partial<Styles>;
}

/** Formik-connected select input. */
export function SelectField({
  className,
  hideLabel,
  name,
  label,
  onChange = noop,
  options,
  styles,
  tooltipMsg
}: SelectFieldProps) {
  return (
    <FastField name={name}>
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
          <FieldWrapper
            className={className}
            hideLabel={hideLabel}
            name={name}
            label={label}
            tooltipMsg={tooltipMsg}
          >
            <Select
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
