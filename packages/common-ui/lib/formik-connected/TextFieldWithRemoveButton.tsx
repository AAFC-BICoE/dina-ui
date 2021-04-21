import React, { ChangeEvent, useRef, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";

export function TextFieldWithRemoveButton(props: TextFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [newGeoGraphicPlace, setNewGeoGraphicPlace] = useState("");

  const removeEntry = () => {
    setNewGeoGraphicPlace("removed");
  };

  return newGeoGraphicPlace !== "removed" ? (
    <TextField
      {...props}
      customInput={inputProps => (
        <div className="input-group div-has-button">
          <input ref={inputRef} {...inputProps} />
          <div className="input-group-append">
            <button
              onClick={() => removeEntry()}
              className="btn btn-danger self-remove-button"
              type="button"
            >
              {"x"}
            </button>
          </div>
        </div>
      )}
    />
  ) : null;
}
