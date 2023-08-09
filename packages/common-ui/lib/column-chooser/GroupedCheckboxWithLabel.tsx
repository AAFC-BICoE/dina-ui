import React from "react";
import { useIntl } from "react-intl";

export interface CheckboxProps {
  id: string;
  name?: string;
  handleClick: (e: any) => void;
  isChecked: boolean;
}

export function Checkbox({ id, name, handleClick, isChecked }: CheckboxProps) {
  const { formatMessage, messages } = useIntl();
  // Try to use dina messages first, if not just use the string directly.
  const label = name ?? (messages[id] ? formatMessage({ id }) : id);
  return (
    <input
      id={id}
      name={label}
      type={"checkbox"}
      onChange={handleClick}
      checked={isChecked}
    />
  );
}
