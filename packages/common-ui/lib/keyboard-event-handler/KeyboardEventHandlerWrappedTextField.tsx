import dynamic from "next/dynamic";
import React from "react";
import { ComponentType, createContext, ReactNode } from "react";
import { TextField, TextFieldProps } from "../formik-connected/TextField";

const KeyboardEventHandler: ComponentType<any> = dynamic(
  () => {
    return import("react-keyboard-event-handler");
  },
  { ssr: false }
);

interface KeyboardEventHandlerWrapperContextI {
  handleKeys: string[];
  onKeyEvent: (key, e) => void;
}

const KeyboardEventHandlerWrapperContext = createContext<
  KeyboardEventHandlerWrapperContextI
>(null as any);

export type KeyboardEventHandlerWrappedTextFieldProps = TextFieldProps &
  KeyboardEventHandlerWrapperContextI;

export function KeyboardEventHandlerWrappedTextField({
  handleKeys,
  onKeyEvent,
  ...textFieldProps
}: KeyboardEventHandlerWrappedTextFieldProps) {
  return (
    <KeyboardEventHandlerWrapperContext.Provider
      value={{ handleKeys, onKeyEvent }}
    >
      <KeyboardEventHandlerWrapperInternal
        handleKeys={handleKeys}
        onKeyEvent={onKeyEvent}
        {...textFieldProps}
      />
    </KeyboardEventHandlerWrapperContext.Provider>
  );
}

function KeyboardEventHandlerWrapperInternal({
  handleKeys,
  onKeyEvent,
  name
}: KeyboardEventHandlerWrappedTextFieldProps) {
  return (
    <KeyboardEventHandler handleKeys={handleKeys} onKeyEvent={onKeyEvent}>
      <TextField name={name} />
    </KeyboardEventHandler>
  );
}
