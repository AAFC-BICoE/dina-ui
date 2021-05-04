import React, { ChangeEvent, useRef, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";

export function TextFieldWithRemoveButton(props: TextFieldProps) {
  const [shouldRemove, setShouldRemove] = useState(false);

  /* Clear the input value and remove the whole wrapping div */
  const removeEntry = onChange => {
    onChange?.({
      target: { value: "" }
    } as ChangeEvent<HTMLInputElement>);
    setShouldRemove(true);
  };

  return shouldRemove === false ? (
    <TextField
      {...props}
      customInput={inputProps => (
        <div className="input-group div-has-button">
          <input {...inputProps} type="text" />
          <div className="input-group-append">
            <button
              className="btn btn-danger self-remove-button"
              style={{ height: "97%" }}
              aria-label="Close"
              onClick={() => removeEntry(inputProps.onChange)}
              type="button"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      )}
    />
  ) : null;
}
