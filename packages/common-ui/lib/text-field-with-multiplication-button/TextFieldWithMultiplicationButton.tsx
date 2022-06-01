import React, { ChangeEvent, InputHTMLAttributes, useRef } from "react";
import { TextField, TextFieldProps } from "../formik-connected/TextField";
import { Tooltip } from "../tooltip/Tooltip";

/**
 * Shows buttons for degree, minute and second entry.
 */
export function TextFieldWithMultiplicationButton(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      customInput={inputProps => (
        <InputWithMultiplicationButton {...inputProps} />
      )}
    />
  );
}

export function InputWithMultiplicationButton({
  ...inputProps
}: InputHTMLAttributes<any>) {
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

  const symbolToAdd = "×";

  return (
    <div className="input-group">
      <input type="text" {...inputProps} ref={inputRef} />
      <button
        key={symbolToAdd}
        tabIndex={-1}
        className={"btn btn-info multiplication-button"}
        type="button"
        style={{ width: "3rem" }}
        onClick={() => insertSymbol(symbolToAdd)}
      >
        {symbolToAdd}
      </button>
      <Tooltip id="insertHybridSymbol" />
    </div>
  );
}
