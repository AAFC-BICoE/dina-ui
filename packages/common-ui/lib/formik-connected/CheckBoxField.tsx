import React, { ChangeEvent } from "react";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { OnFormikSubmit } from "./safeSubmit";

export interface CheckBoxProps extends FieldWrapperProps {
  onCheckBoxClick?: OnFormikSubmit<ChangeEvent<HTMLInputElement>>;
  disabled?: boolean;
  type?: string;
  overridecheckboxProps?: any;
}

const checkboxProps = {
  style: {
    display: "block",
    height: "20px",
    marginLeft: "15px",
    width: "20px"
  },
  type: "checkbox"
};

export function CheckBoxField(props: CheckBoxProps) {
  const { onCheckBoxClick, disabled } = props;
  return (
    <FieldWrapper {...props} readOnlyRender={(value) => String(!!value)}>
      {({ setValue, value, formik }) => {
        function onChange(event: ChangeEvent<HTMLInputElement>) {
          setValue(event.target.checked);
          onCheckBoxClick?.(event, formik);
        }

        return (
          <input
            {...checkboxProps}
            {...props.overridecheckboxProps}
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
