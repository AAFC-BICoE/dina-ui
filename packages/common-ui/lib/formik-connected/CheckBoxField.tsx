import { FastField, FieldProps } from "formik";
import React from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface CheckBoxProps extends LabelWrapperParams {
  onCheckBoxClick?: (e) => void;
  disabled?: boolean;
}

export function CheckBoxField(props: CheckBoxProps) {
  const { name, onCheckBoxClick, disabled } = props;
  return (
    <FieldWrapper {...props}>
      <FastField name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          function onChange(event) {
            setFieldValue(name, event.target.checked);
            setFieldTouched(name);
            onCheckBoxClick?.(event);
          }

          return (
            <input
              checked={value || false}
              onChange={onChange}
              style={{
                display: "block",
                height: "20px",
                margin: "auto",
                width: "20px"
              }}
              type="checkbox"
              value={value || false}
              disabled={disabled}
            />
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
