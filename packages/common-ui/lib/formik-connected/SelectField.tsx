// tslint:disable: no-string-literal
import { FormikContextType } from "formik";
import { find, isArray, castArray, compact } from "lodash";
import { ComponentProps, RefObject } from "react";
import Select, { StylesConfig } from "react-select";
import { ReadOnlyValue } from "./FieldView";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";

export interface SelectOption<T> {
  label: string;
  value?: T;
}

export interface SelectFieldProps<T> extends FieldWrapperProps {
  disabled?: boolean;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  onChange?: (
    value: T | T[] | null | undefined,
    formik: FormikContextType<any>,
    oldValue?: T | T[] | null | undefined
  ) => void;
  options: SelectOption<T>[] | undefined;
  styles?: Partial<StylesConfig<SelectOption<T | null | undefined>, boolean>>;

  forwardedRef?: RefObject<HTMLSelectElement>;
  isLoading?: boolean;

  selectProps?: Partial<ComponentProps<typeof Select>>;
  filterValues?: any;
  readOnlyBold?: boolean;
}

/** The value could be one element or an array. */
type SingleOrArray<T> = T | T[];

/** Formik-connected select input. */
export function SelectField<T>(props: SelectFieldProps<T>) {
  const {
    disabled,
    isMulti,
    onChange,
    options,
    styles,
    forwardedRef,
    isLoading,
    selectProps,
    readOnlyRender,
    filterValues,
    readOnlyBold,
    ...labelWrapperProps
  } = props;

  const defaultReadOnlyRender = (value?: SingleOrArray<T | null>) => {
    const values = compact(castArray(value));
    const labels = compact(
      values.map(
        (item) =>
          find(options, (option) => option.value === item)?.label ?? item
      )
    );
    return (
      <div className="read-only-view">
        <ReadOnlyValue
          link={labelWrapperProps.link}
          value={labels ?? [].join(", ")}
          bold={readOnlyBold}
        />
      </div>
    );
  };

  return (
    <FieldWrapper
      {...labelWrapperProps}
      readOnlyRender={readOnlyRender ?? defaultReadOnlyRender}
    >
      {({ setValue, value, formik, invalid, placeholder }) => {
        function onChangeInternal(
          change: SelectOption<T>[] | SelectOption<T> | null
        ) {
          // Set default empty array value if the new value is null:
          if (isMulti && change === null) {
            change = [];
          }

          const newValue = isArray(change)
            ? change.map((option) => option.value)
            : change?.value;
          setValue(newValue);
          onChange?.(newValue as any, formik, value);
        }

        let selectedOption;

        if (isMulti) {
          selectedOption = options?.filter((option) =>
            value?.includes(option.value)
          );
        } else if (value) {
          selectedOption = options
            ?.filter((opt) => !!opt.value)
            ?.find((option) => option.value === value) as any;
          // also search in possible nested options
          if (!selectedOption || Object.keys(selectedOption).length === 0) {
            const optionWithNested = options?.filter((opt) => !!opt["options"]);
            optionWithNested?.map((option) =>
              option["options"].map((opt) => {
                if (opt.value === value) {
                  selectedOption = opt;
                  return;
                }
              })
            );
          }

          if (!selectedOption || Object.keys(selectedOption).length === 0) {
            selectedOption = { label: String(value), value };
          }
        } else {
          selectedOption = null;
        }

        const customStyle = {
          placeholder: (provided, _) => ({
            ...provided,
            color: "rgb(87,120,94)"
          }),
          menu: (base) => ({ ...base, zIndex: 1050 }),
          control: (base) => ({
            ...base,
            ...(invalid && {
              borderColor: "rgb(148, 26, 37)",
              "&:hover": { borderColor: "rgb(148, 26, 37)" }
            })
          }),
          ...styles
        };

        return (
          <div className={invalid ? "is-invalid" : ""}>
            <Select
              isDisabled={disabled}
              isMulti={isMulti}
              options={options}
              onChange={onChangeInternal}
              value={selectedOption}
              styles={customStyle as any}
              isLoading={isLoading}
              classNamePrefix="react-select"
              ref={forwardedRef as any}
              {...selectProps}
              placeholder={placeholder ?? selectProps?.placeholder}
              filterOption={
                filterValues
                  ? (option) => !filterValues.includes(option.value)
                  : undefined
              }
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
