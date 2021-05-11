import { isArray } from "lodash";
import Select from "react-select";
import { Styles } from "react-select/src/styles";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface SelectOption<T> {
  label: string;
  value: T;
}

export interface SelectFieldProps<T = string> extends LabelWrapperParams {
  disabled?: boolean;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  onChange?: (value?: T | T[] | null) => void;
  options: SelectOption<T>[];
  styles?: Partial<Styles<SelectOption<T | null | undefined>, boolean>>;
}

/** Formik-connected select input. */
export function SelectField<T = string>(props: SelectFieldProps<T>) {
  const {
    disabled,
    isMulti,
    onChange,
    options,
    styles,
    ...labelWrapperProps
  } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ setValue, value }) => {
        function onChangeInternal(
          change: SelectOption<T>[] | SelectOption<T> | null
        ) {
          // Set default empty array value if the new value is null:
          if (isMulti && change === null) {
            change = [];
          }

          const newValue = isArray(change)
            ? change.map(option => option.value)
            : change?.value;
          setValue(newValue);
          onChange?.(newValue);
        }

        const selectedOption = isMulti
          ? options?.filter(option => value?.includes(option.value))
          : options.find(option => option.value === value) ?? null;

        return (
          <Select
            isDisabled={disabled}
            isMulti={isMulti}
            options={options}
            onChange={onChangeInternal}
            value={selectedOption}
          />
        );
      }}
    </FieldWrapper>
  );
}
