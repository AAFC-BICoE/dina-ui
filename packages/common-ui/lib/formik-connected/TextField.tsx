import { FormikProps } from "formik";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import TextareaAutosize, {
  TextareaAutosizeProps
} from "react-textarea-autosize";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import classnames from "classnames";
import React from "react";

export interface TextFieldProps extends FieldWrapperProps {
  readOnly?: boolean;
  disabled?: boolean;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<any> | TextareaHTMLAttributes<any>;
  placeholder?: string;
  numberOnly?: boolean;
  letterOnly?: boolean;
  noSpace?: boolean;
  customInput?: (
    inputProps: InputHTMLAttributes<any>,
    form: FormikProps<any>
  ) => JSX.Element;
  onChangeExternal?: (
    form: FormikProps<any>,
    name: string,
    value: string | null
  ) => void;
}

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */
export function TextField(props: TextFieldProps) {
  const {
    readOnly,
    disabled,
    multiLines,
    inputProps: inputPropsExternal,
    customInput,
    onChangeExternal,
    numberOnly,
    letterOnly,
    noSpace,
    ...fieldWrapperProps
  } = props;

  return (
    <FieldWrapper {...fieldWrapperProps}>
      {({ formik, setValue, value, invalid, placeholder }) => {
        function onChangeInternal(newValue: string) {
          setValue(newValue);
          onChangeExternal?.(formik, props.name, newValue);
        }

        const onKeyDown = (e) => {
          const NUMBER_ALLOWED_CHARS_REGEXP = /[0-9]+/;
          const CTRL_ALLOWED_CHARS_REGEXP =
            /^(Backspace|Delete|ArrowLeft|ArrowRight)$/;
          const LETTER_ALLOWED_CHARS_REGEXP = /[A-Za-z]+/;
          if (
            (!CTRL_ALLOWED_CHARS_REGEXP.test(e.key) &&
              ((numberOnly && !NUMBER_ALLOWED_CHARS_REGEXP.test(e.key)) ||
                (letterOnly && !LETTER_ALLOWED_CHARS_REGEXP.test(e.key)))) ||
            (noSpace && e.code === "Space")
          ) {
            e.preventDefault();
          } else {
            inputPropsExternal?.onKeyDown?.(e);
          }
        };

        const inputPropsInternal: InputHTMLAttributes<HTMLInputElement> = {
          ...inputPropsExternal,
          placeholder: placeholder || fieldWrapperProps.placeholder,
          className: classnames(
            "form-control",
            { "is-invalid": invalid },
            inputPropsExternal?.className
          ),
          onChange: (event) => onChangeInternal(event.target.value),
          value: value || "",
          readOnly,
          disabled,
          onKeyDown
        };

        // The default Field component's inner text input needs to be replaced with our own
        // controlled input that we manually pass the "onChange" and "value" props. Otherwise
        // we will get React's warning about switching from an uncontrolled to controlled input.
        return (
          customInput?.(inputPropsInternal, formik) ??
          (multiLines ? (
            <TextareaAutosize
              minRows={
                (inputPropsExternal as TextareaHTMLAttributes<any>)?.rows || 2
              }
              {...(inputPropsInternal as TextareaAutosizeProps)}
            />
          ) : (
            <input type="text" {...inputPropsInternal} />
          ))
        );
      }}
    </FieldWrapper>
  );
}
