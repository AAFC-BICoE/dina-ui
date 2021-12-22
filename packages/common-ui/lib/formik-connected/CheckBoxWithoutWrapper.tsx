import React, { ChangeEvent } from "react";
import { useIntl } from "react-intl";
import { FieldSpy } from "..";

export interface CheckBoxWithoutWrapperProps {
  onClickIncludeAll?: (e, form, id) => void;
  disabled?: boolean;
  name: string;
  className?: string;
  parentContainerId?: string;
  includeAllLabel?: string;
  customLayout?: string[];
  notTakingFullRow?: boolean;
}

const checkboxProps = {
  style: {
    display: "block",
    height: "20px",
    marginLeft: "15px",
    width: "20px",
    // So clicking the checkbox takes priority over the surrounding label:
    zIndex: 1000
  },
  tabIndex: -1,
  type: "checkbox"
};

export function CheckBoxWithoutWrapper(props: CheckBoxWithoutWrapperProps) {
  const {
    parentContainerId: id,
    onClickIncludeAll,
    className,
    includeAllLabel,
    customLayout,
    notTakingFullRow
  } = props;
  const { formatMessage } = useIntl();

  return (
    <FieldSpy<boolean> fieldName={props.name}>
      {(value, { form, field: { name } }) => {
        function onChange(event: ChangeEvent<HTMLInputElement>) {
          form.setFieldValue(name, event.target.checked);
          onClickIncludeAll?.(event, form, id);
        }

        return includeAllLabel ? (
          <label className={notTakingFullRow ? "mb-3" : "row mb-3"}>
            <input
              {...checkboxProps}
              checked={value || false}
              onChange={onChange}
              className={`${className} ${
                customLayout ? customLayout[0] : "col-sm-1"
              }`}
              name={name}
              tabIndex={0}
            />
            <div
              className={`${
                customLayout ? customLayout[1] : "col-sm-10"
              } fw-bold`}
            >
              {" "}
              {includeAllLabel}
            </div>
          </label>
        ) : (
          <input
            {...checkboxProps}
            checked={value || false}
            onChange={onChange}
            className={className}
            name={name}
            aria-label={formatMessage({ id: "select" })}
            tabIndex={0}
          />
        );
      }}
    </FieldSpy>
  );
}
