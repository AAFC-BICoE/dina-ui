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
      {({ setValue, value, formik }) => {
        function onChange(event) {
          setValue(event.target.checked);
          onCheckBoxClick?.(event, formik);
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
