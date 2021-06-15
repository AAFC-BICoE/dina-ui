import React from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

interface NumberSpinnerFieldProps extends LabelWrapperParams {
  onChange?: (e) => void;
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

  return (
    <FieldWrapper {...props}>
      {({ setValue, value }) => {
        function onChangeInternal(newValue: string) {
          const val = parseInt(newValue, 10);
          // Reset to max if go above max
          if (!isNaN(val) && val > max) {
            setValue(max);
            onChange?.(max);
          } else {
            setValue(newValue);
            onChange?.(newValue);
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
              onChange={e => onChangeInternal(e.target.value)}
              value={value}
            />
          </>
        );
      }}
    </FieldWrapper>
  );
}
