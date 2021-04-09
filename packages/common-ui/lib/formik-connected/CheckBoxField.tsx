import { FastField, FieldProps } from "formik";
import React, { ChangeEvent } from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";
import { OnFormikSubmit } from "./safeSubmit";

export interface CheckBoxProps extends LabelWrapperParams {
  onCheckBoxClick?: OnFormikSubmit<ChangeEvent<HTMLInputElement>>;
  disabled?: boolean;
}

const checkboxProps = {
  style: {
    display: "block",
    height: "20px",
    margin: "auto",
    width: "20px"
  },
  type: "checkbox"
};

export function CheckBoxField(props: CheckBoxProps) {
  const { name, onCheckBoxClick, disabled } = props;
  return (
    <FieldWrapper
      {...props}
      readOnlyRender={value => (
        <input
          {...checkboxProps}
          checked={value || false}
          value={value || false}
          disabled={true}
        />
      )}
    >
      <FastField name={name}>
        {({ field: { value }, form }: FieldProps) => {
          function onChange(event, formik) {
            formik.setFieldValue(name, event.target.checked);
            formik.setFieldTouched(name);
            onCheckBoxClick?.(event, formik);
          }

          return (
            <input
              {...checkboxProps}
              checked={value || false}
              onChange={event => onChange(event, form)}
              value={value || false}
              disabled={disabled}
            />
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
