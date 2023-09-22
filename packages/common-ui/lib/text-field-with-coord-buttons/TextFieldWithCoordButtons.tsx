import React, { ChangeEvent, InputHTMLAttributes, useRef } from "react";
import { TextField, TextFieldProps } from "../formik-connected/TextField";

export interface TextFieldWithCoordButtonsProps extends TextFieldProps {
  isExternallyControlled?: boolean;
  shouldShowDegree?: boolean;
  shouldShowMinute?: boolean;
  shouldShowSecond?: boolean;
}

export interface InputWithCoordButtonsProps extends InputHTMLAttributes<any> {
  isExternallyControlled?: boolean;
  shouldShowDegree?: boolean;
  shouldShowMinute?: boolean;
  shouldShowSecond?: boolean;
}

/**
 * Shows buttons for degree, minute and second entry.
 */
export function TextFieldWithCoordButtons(
  props: TextFieldWithCoordButtonsProps
) {
  return (
    <TextField
      {...props}
      customInput={(inputProps) => (
        <InputWithCoordButtons
          shouldShowDegree={props.shouldShowDegree}
          shouldShowMinute={props.shouldShowMinute}
          shouldShowSecond={props.shouldShowSecond}
          isExternallyControlled={props.isExternallyControlled}
          {...inputProps}
        />
      )}
    />
  );
}

export function InputWithCoordButtons({
  isExternallyControlled,
  shouldShowDegree,
  shouldShowMinute,
  shouldShowSecond,
  ...inputProps
}: InputWithCoordButtonsProps) {
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
      {["°", "′", "″"].map((symbol) => (
        <button
          key={symbol}
          tabIndex={0}
          className={
            !isExternallyControlled
              ? "btn btn-info coord-button"
              : (symbol === "°" && shouldShowDegree) ||
                (symbol === "′" && shouldShowMinute) ||
                (symbol === "″" && shouldShowSecond)
              ? "btn btn-info coord-button"
              : "d-none"
          }
          type="button"
          style={{ width: "3rem" }}
          onClick={() => insertSymbol(symbol)}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
