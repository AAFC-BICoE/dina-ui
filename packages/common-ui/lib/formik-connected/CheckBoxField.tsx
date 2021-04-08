import React from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface CheckBoxProps extends LabelWrapperParams {
  onCheckBoxClick?: (e) => void;
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
  const { onCheckBoxClick, disabled } = props;
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
      {({ setValue, value }) => {
        function onChange(event) {
          setValue(event.target.checked);
          onCheckBoxClick?.(event);
        }

        return (
          <input
            {...checkboxProps}
            checked={value || false}
            onChange={onChange}
            value={value || false}
            disabled={disabled}
          />
        );
      }}
    </FieldWrapper>
  );
}
