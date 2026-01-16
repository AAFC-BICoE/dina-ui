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

  // Determine which symbols are actually visible
  const visibleSymbols = [
    { symbol: "°", show: !isExternallyControlled || shouldShowDegree },
    { symbol: "′", show: !isExternallyControlled || shouldShowMinute },
    { symbol: "″", show: !isExternallyControlled || shouldShowSecond }
  ].filter((item) => item.show);

  return (
    <div className="input-group">
      <input type="text" {...inputProps} ref={inputRef} />
      {visibleSymbols.map(({ symbol }, index) => {
        // Check if this is the last button
        const isLast = index === visibleSymbols.length - 1;

        return (
          <button
            key={symbol}
            tabIndex={0}
            className="btn btn-info coord-button"
            type="button"
            style={{
              width: "3rem",
              // Apply radius only if it is the last item
              borderTopRightRadius: isLast ? "0.25rem" : 0,
              borderBottomRightRadius: isLast ? "0.25rem" : 0
            }}
            onClick={() => insertSymbol(symbol)}
          >
            {symbol}
          </button>
        );
      })}
    </div>
  );
}
