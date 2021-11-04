import { FormikProps } from "formik";
import React from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

interface NumberSpinnerFieldProps extends LabelWrapperParams {
  onChangeExternal?: (formik: FormikProps<any>, name, newValue) => void;
  min?: number;
  max: number;
  defaultValue?: number;
  size?: number;
  step?: number;
}

export default function NumberSpinnerField(props: NumberSpinnerFieldProps) {
  const { min, max, size, step, onChangeExternal, name } = props;

  /* Avoid entries like 'e' for valid number */
  const onKeyDown = e => {
    const NUMBER_ALLOWED_CHARS_REGEXP = /[0-9]+/;
    const CTRL_ALLOWED_CHARS_REGEXP =
      /^(Backspace|Delete|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Tab)$/;
    if (
      !NUMBER_ALLOWED_CHARS_REGEXP.test(e.key) &&
      !CTRL_ALLOWED_CHARS_REGEXP.test(e.key)
    ) {
      e.preventDefault();
    }
  };
  return (
    <FieldWrapper {...props}>
      {({ setValue, value, formik }) => {
        function onChangeInternal(newValue: string) {
          const val = parseInt(newValue, 10);
          // Reset to max if go above max
          if (!isNaN(val) && val > max) {
            setValue(max);
            onChangeExternal?.(formik, name, max);
          } else {
            setValue(newValue);
            onChangeExternal?.(formik, name, newValue);
          }
        }

        return (
          <>
            <input
              id="numberSpinnerForChildMaterialSamples"
              className="form-control"
              type="number"
              min={min ?? 1}
              max={max}
              size={size ?? 4}
              step={step ?? 1}
              onKeyDown={onKeyDown}
              onChange={e => onChangeInternal(e.target.value)}
              value={value}
              tabIndex={1}
            />
          </>
        );
      }}
    </FieldWrapper>
  );
}
