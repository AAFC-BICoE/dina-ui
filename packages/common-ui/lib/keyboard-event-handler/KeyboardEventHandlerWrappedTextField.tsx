import { FastField, FieldProps } from "formik";
import dynamic from "next/dynamic";
import React, { ComponentType } from "react";
import { FieldWrapper } from "../formik-connected/FieldWrapper";
import { TextFieldProps } from "../formik-connected/TextField";

export const KeyboardEventHandler: ComponentType<any> = dynamic(
  () => {
    return import("react-keyboard-event-handler");
  },
  { ssr: false }
);

/**
 * This component detects shortcut key alt+1,alt+2,alt+3 for aiding vabatime
 * data entry of degree, minute and second
 */

export function KeyboardEventHandlerWrappedTextField(props: TextFieldProps) {
  const {
    initialValue,
    readOnly,
    multiLines,
    inputProps: inputPropsExternal,
    placeholder,
    CustomInput,
    ...labelWrapperProps
  } = props;
  const { name } = labelWrapperProps;
  return (
    <FieldWrapper {...labelWrapperProps}>
      <FastField name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          const keyEventHandler = (key, e) => {
            key === "alt+1"
              ? (e.target.value += "°")
              : key === "alt+2"
              ? (e.target.value += "′")
              : key === "alt+3"
              ? (e.target.value += "″")
              : (e.target.value = e.target.value);
            onChange(e);
          };

          function onChange(event) {
            setFieldValue(name, event.target.value);
            setFieldTouched(name);
          }

          const inputPropsInternal = {
            ...inputPropsExternal,
            placeholder,
            className: "form-control",
            onChange,
            value: value || "",
            readOnly
          };
          return (
            <>
              <KeyboardEventHandler
                handleKeys={["alt+1", "alt+2", "alt+3"]}
                onKeyEvent={keyEventHandler}
              >
                {<input type="text" {...inputPropsInternal} />}
              </KeyboardEventHandler>
            </>
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
