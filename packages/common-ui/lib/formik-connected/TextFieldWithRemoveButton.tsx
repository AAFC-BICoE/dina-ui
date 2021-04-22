import React, { ChangeEvent, useRef, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";

export function TextFieldWithRemoveButton(props: TextFieldProps) {
  
  const [newGeoGraphicPlace, setNewGeoGraphicPlace] = useState("");

  /* Clear the input value and remove the whole wrapping div */
  const removeEntry = ( onChange ) => {
    onChange?.({
      target: { value: "" }
    } as ChangeEvent<HTMLInputElement>);  
    setNewGeoGraphicPlace("removed");
  };

  return newGeoGraphicPlace !== "removed" ? (
    <TextField
      {...props}
      customInput={inputProps => (
        <div className="input-group div-has-button">
          <input {...inputProps} type="text"/>
          <div className="input-group-append">
            <button
              onClick={() => removeEntry(inputProps.onChange)}
              className="btn btn-danger self-remove-button"
              type="button"            >
              {"x"}
            </button>
          </div>
        </div>
      )}
    />
  ) : null;
}
