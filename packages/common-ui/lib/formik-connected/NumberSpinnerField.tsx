import { FormikProps } from "formik";
import React from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

interface NumberSpinnerFieldProps extends LabelWrapperParams {
  onChange?: (e, formik: FormikProps<any>) => void;
  min?: number;
  max: number;
  defaultValue?: number;
  size?: number;
  step?: number;
}

export default function NumberSpinnerField(props: NumberSpinnerFieldProps) {
  const { min, max, defaultValue, size, step, onChange, name } = props;

  const customStyle = (
    <style>{`
    /* Making sure under chrome, the spinnig show by default */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button {  
       opacity: 1;
    }    
  `}</style>
  );

  /* Avoid entries like 'e' for valid number */
  const onKeyDown = e => {
    const NUMBER_ALLOWED_CHARS_REGEXP = /[0-9]+/;
    const CTRL_ALLOWED_CHARS_REGEXP =
      /^(Backspace|Delete|ArrowLeft|ArrowRight)$/;
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
            onChange?.(max, formik);
          } else {
            setValue(newValue);
            onChange?.(newValue, formik);
          }
        }

        return (
          <>
            {customStyle}
            <input
              className="form-control"
              type="number"
              min={min ?? 1}
              max={max}
              size={size ?? 4}
              step={step ?? 1}
              onKeyDown={onKeyDown}
              onChange={e => onChangeInternal(e.target.value)}
              value={value}
            />
          </>
        );
      }}
    </FieldWrapper>
  );
}
