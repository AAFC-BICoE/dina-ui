import { FormikContextType } from "formik";
import { isArray } from "lodash";
import { ComponentProps, RefObject } from "react";
import Select, { StylesConfig } from "react-select";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface SelectOption<T> {
  label: string;
  value: T;
}

export interface SelectFieldProps<T = string> extends LabelWrapperParams {
  disabled?: boolean;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  onChange?: (
    value: T | T[] | null | undefined,
    formik: FormikContextType<any>
  ) => void;
  options: SelectOption<T>[];
  styles?: Partial<StylesConfig<SelectOption<T | null | undefined>, boolean>>;

  forwardedRef?: RefObject<HTMLSelectElement>;
  isLoading?: boolean;

  selectProps?: Partial<ComponentProps<typeof Select>>;
}

/** Formik-connected select input. */
export function SelectField<T = string>(props: SelectFieldProps<T>) {
  const {
    disabled,
    isMulti,
    onChange,
    options,
    styles,
    forwardedRef,
    isLoading,
    selectProps,
    ...labelWrapperProps
  } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ setValue, value, formik, invalid }) => {
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
          onChange?.(newValue, formik);
        }

        const selectedOption = isMulti
          ? options?.filter(option => value?.includes(option.value))
          : value
          ? options?.find(option => option.value === value) ?? {
              label: String(value),
              value
            }
          : null;

        const customStyle = {
          placeholder: (provided, _) => ({
            ...provided,
            color: "rgb(87,120,94)"
          }),
          menu: base => ({ ...base, zIndex: 1050 }),
          control: base => ({
            ...base,
            ...(invalid && {
              borderColor: "rgb(148, 26, 37)",
              "&:hover": { borderColor: "rgb(148, 26, 37)" }
            })
          })
        };

        return (
          <div className={invalid ? "is-invalid" : ""}>
            <Select
              isDisabled={disabled}
              isMulti={isMulti}
              options={options}
              onChange={onChangeInternal}
              value={selectedOption}
              styles={customStyle}
              isLoading={isLoading}
              ref={forwardedRef as any}
              {...selectProps}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
