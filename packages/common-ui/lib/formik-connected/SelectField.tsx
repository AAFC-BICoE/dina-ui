import { FastField, FieldProps } from "formik";
import { isArray } from "lodash";
import Select from "react-select";
import { Styles } from "react-select/src/styles";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface SelectOption {
  label: string;
  value: any;
}

export interface SelectFieldProps extends LabelWrapperParams {
  disabled?: boolean;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  onChange?: ((value?: string) => void) | ((value?: string[]) => void);
  options: SelectOption[];
  styles?: Partial<Styles>;
}

/** Formik-connected select input. */
export function SelectField(props: SelectFieldProps) {
  const {
    disabled,
    isMulti,
    onChange,
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
        function onChangeInternal(
          change: SelectOption[] | SelectOption | null
        ) {
          // Set default empty array value if the new value is null:
          if (isMulti && change === null) {
            change = [];
          }

          const newValue = isArray(change)
            ? change.map(option => option.value)
            : change?.value ?? null;
          setFieldValue(name, newValue);
          setFieldTouched(name);
          onChange?.(newValue);
        }

        return (
          <FieldWrapper {...labelWrapperProps}>
            <Select
              isDisabled={disabled}
              isMulti={isMulti}
              options={options}
              onChange={onChangeInternal}
              styles={styles}
              value={
                isMulti
                  ? options?.filter(option => value?.includes(option.value))
                  : options.find(option => option.value === value)
              }
            />
          </FieldWrapper>
        );
      }}
    </FastField>
  );
}
