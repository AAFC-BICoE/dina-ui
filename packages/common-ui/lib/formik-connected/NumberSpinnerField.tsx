import React from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

interface NumberSpinnerFieldProps extends LabelWrapperParams {
  onChange?: (e) => void;
  min?: number;
  max?: number;
  defaultValue?: number;
  size?: number;
  step?: number;
}

export default function NumberSpinnerField(props: NumberSpinnerFieldProps) {
  const { min, max, defaultValue, size, step, onChange, name } = props;

  return (
    <FieldWrapper {...props}>
      {({}) => {
        function onChangeInternal(e) {
          onChange?.(e);
        }
        return (
          <input
            className="form-control"
            type="number"
            min={min ?? 1}
            max={max ?? ""}
            defaultValue={defaultValue ?? 1}
            size={size ?? 4}
            step={step ?? 1}
            onChange={onChangeInternal}
          />
        );
      }}
    </FieldWrapper>
  );
}
