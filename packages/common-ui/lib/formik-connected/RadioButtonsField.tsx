import { ReactNode } from "react";
import { FieldWrapper, FieldWrapperProps } from "..";

export interface RadioFieldProps<T> extends FieldWrapperProps {
  options: { label: ReactNode; value: T }[];
}

export function RadioButtonsField<T = any>({
  options,
  ...props
}: RadioFieldProps<T>) {
  return (
    <FieldWrapper disableLabelClick={true} {...props}>
      {({
        defaultValue,
        value = defaultValue ?? null,
        setValue,
        placeholder
      }) => (
        <div>
          {placeholder && (
            <span className="placeholder-text">{placeholder}</span>
          )}
          {options.map((option, index) => (
            <div className="form-check" key={index}>
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  checked={value === option.value}
                  onChange={() => setValue(option.value)}
                />
                {option.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </FieldWrapper>
  );
}
