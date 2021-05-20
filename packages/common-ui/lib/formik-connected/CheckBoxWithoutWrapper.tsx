import { FastField } from "formik";
import React, { ChangeEvent } from "react";

export interface CheckBoxWithoutWrapperProps {
  onClickIncludeAll?: (e, form, id) => void;
  disabled?: boolean;
  name: string;
  className?: string;
  parentContainerId?: string;
  includeAllLabel?: string;
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

export function CheckBoxWithoutWrapper(props: CheckBoxWithoutWrapperProps) {
  const {
    parentContainerId: id,
    onClickIncludeAll,
    className,
    includeAllLabel
  } = props;
  return (
    <FastField {...props}>
      {({ form, field: { value, name } }) => {
        function onChange(event: ChangeEvent<HTMLInputElement>) {
          form.setFieldValue(name, event.target.checked);
          onClickIncludeAll?.(event, form, id);
        }

        return includeAllLabel ? (
          <label className="row">
            <input
              {...checkboxProps}
              checked={value || false}
              onChange={onChange}
              value={value || false}
              className={`${className} col-sm-1`}
              name={name}
            />
            <div className="col-sm-10"> {includeAllLabel}</div>
          </label>
        ) : (
          <input
            {...checkboxProps}
            checked={value || false}
            onChange={onChange}
            value={value || false}
            className={className}
            name={name}
          />
        );
      }}
    </FastField>
  );
}
