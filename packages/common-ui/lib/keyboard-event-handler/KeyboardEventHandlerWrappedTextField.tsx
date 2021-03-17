import dynamic from "next/dynamic";
import React, { ChangeEvent, ComponentType, PropsWithChildren } from "react";
import { TextField, TextFieldProps } from "../formik-connected/TextField";

export const KeyboardEventHandler: ComponentType<any> = dynamic(
  () => import("react-keyboard-event-handler"),
  { ssr: false }
);

/**
 * This component detects shortcut key alt+1,alt+2,alt+3 for aiding verbatim
 * data entry of degree, minute and second
 */
export function KeyboardEventHandlerWrappedTextField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      customInput={inputProps => (
        <KeyboardEventHandlerWrapper onChange={inputProps.onChange}>
          <input type="text" {...inputProps} />
        </KeyboardEventHandlerWrapper>
      )}
    />
  );
}

/** Wraps an input with alt+1,alt+2,alt+3 shortcuts for adding degree, minute and second symbols. */
export function KeyboardEventHandlerWrapper({
  children,
  onChange
}: PropsWithChildren<{ onChange?: (e: ChangeEvent<any>) => void }>) {
  function handleKeyEvent(key, e) {
    key === "alt+1"
      ? (e.target.value += "°")
      : key === "alt+2"
      ? (e.target.value += "′")
      : key === "alt+3"
      ? (e.target.value += "″")
      : (e.target.value = e.target.value);
    onChange?.(e);
  }

  return (
    <KeyboardEventHandler
      handleKeys={["alt+1", "alt+2", "alt+3"]}
      onKeyEvent={handleKeyEvent}
    >
      {children}
    </KeyboardEventHandler>
  );
}
