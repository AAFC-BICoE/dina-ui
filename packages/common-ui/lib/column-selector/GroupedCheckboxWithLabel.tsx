import { startCase } from "lodash";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { VisibilityState } from "@tanstack/react-table";
import { NOT_EXPORTABLE_COLUMN_IDS } from "./ColumnSelector";

export interface CheckboxProps {
  id: string;
  name?: string;
  isChecked?: boolean;
  isField?: boolean;
  filteredColumnsState?: VisibilityState;
  handleClick?: (e: any) => void;
  ref?: React.ForwardedRef<any>;
  hideLabel?: boolean;
}

export function Checkbox({
  id,
  name,
  isChecked,
  isField,
  filteredColumnsState,
  handleClick,
  ref,
  hideLabel
}: CheckboxProps) {
  const { formatMessage, messages } = useIntl();
  const [checked, setChecked] = useState<boolean>(isChecked ?? false);
  // Try to use dina messages first, if not just use the string directly.
  const messageKey = isField ? `field_${id}` : id;
  const label =
    name ??
    (messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : messages[id]
      ? formatMessage({ id: id as any })
      : startCase(id));
  function internalHandleClick(event) {
    const checkedState = event?.target?.checked;
    setChecked(checkedState);
    if (filteredColumnsState) {
      filteredColumnsState[id] = checkedState;
    }
  }
  return (
    <div hidden={NOT_EXPORTABLE_COLUMN_IDS.includes(id)} ref={ref}>
      <input
        key={id}
        id={id}
        type={"checkbox"}
        onChange={handleClick ?? internalHandleClick}
        checked={checked}
        style={{
          marginRight: "0.3rem",
          height: "1.3rem",
          width: "1.3rem"
        }}
      />
      {!hideLabel && <span>{label}</span>}
    </div>
  );
}
