import React, { ChangeEvent, InputHTMLAttributes, useRef } from "react";
import { TextField, TextFieldProps } from "../formik-connected/TextField";

/**
 * Shows buttons for degree, minute and second entry.
 */
export function TextFieldWithCoordButtons(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      customInput={inputProps => <InputWithCoordButtons {...inputProps} />}
    />
  );
}

export function InputWithCoordButtons(inputProps: InputHTMLAttributes<any>) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertSymbol(symbol: string) {
    const input = inputRef.current;
    if (input) {
      const text = String(inputProps.value ?? "");
      const cursor = input.selectionStart ?? text.length;

      const newValue = `${text.slice(0, cursor)}${symbol}${text.slice(cursor)}`;

      inputProps.onChange?.({
        target: { value: newValue }
      } as ChangeEvent<HTMLInputElement>);

      setImmediate(() => {
        input.focus();
        input.selectionStart = cursor + 1;
      });
    }
  }

  return (
    <div className="input-group">
      <input type="text" {...inputProps} ref={inputRef} />
      <div className="input-group-append">
        {["°", "′", "″"].map(symbol => (
          <button
            key={symbol}
            tabIndex={-1}
            className="btn btn-info coord-button"
            type="button"
            style={{ width: "3rem" }}
            onClick={() => insertSymbol(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
