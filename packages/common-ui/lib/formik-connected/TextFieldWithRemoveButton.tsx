import React, { ChangeEvent, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";
import { useIntl } from "react-intl";

interface TextFieldWithRemoveButtonProps extends TextFieldProps {
  removeItem?: (idx: number) => void;
  index?: number;
  hideCloseBtn?: boolean;
}

export function TextFieldWithRemoveButton(
  props: TextFieldWithRemoveButtonProps
) {
  const [shouldRemove, setShouldRemove] = useState(false);
  const { removeItem, index, hideCloseBtn } = props;
  const { formatMessage } = useIntl();

  /* Clear the input value and remove the whole wrapping div */
  const removeEntry = (onChange) => {
    onChange?.({
      target: { value: "" }
    } as ChangeEvent<HTMLInputElement>);
    removeItem?.(index as any);
    setShouldRemove(true);
  };

  return shouldRemove === false ? (
    <TextField
      {...props}
      customInput={(inputProps) => (
        <div className="input-group div-has-button">
          <input {...inputProps} type="text" />
          <button
            className={`btn btn-danger self-remove-button ${
              hideCloseBtn ? "d-none" : ""
            }`}
            style={{ height: "97%" }}
            aria-label={formatMessage({ id: "closeButtonText" })}
            onClick={() => removeEntry(inputProps.onChange)}
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
    />
  ) : null;
}
