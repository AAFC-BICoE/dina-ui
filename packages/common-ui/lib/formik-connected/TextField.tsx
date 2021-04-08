import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface TextFieldProps extends LabelWrapperParams {
  readOnly?: boolean;
  initialValue?: string;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<any> | TextareaHTMLAttributes<any>;
  placeholder?: string;

  customInput?: (inputProps: InputHTMLAttributes<any>) => JSX.Element;
}

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */
export function TextField(props: TextFieldProps) {
  const {
    initialValue,
    readOnly,
    multiLines,
    inputProps: inputPropsExternal,
    placeholder,
    customInput,
    ...labelWrapperProps
  } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ setValue, value }) => {
        const inputPropsInternal = {
          ...inputPropsExternal,
          placeholder,
          className: "form-control",
          onChange: event => setValue(event.target.value),
          value: value || "",
          readOnly
        };

        // The default Field component's inner text input needs to be replaced with our own
        // controlled input that we manually pass the "onChange" and "value" props. Otherwise
        // we will get React's warning about switching from an uncontrolled to controlled input.
        return (
          customInput?.(inputPropsInternal) ??
          (multiLines ? (
            <textarea rows={4} {...inputPropsInternal} />
          ) : (
            <input type="text" {...inputPropsInternal} />
          ))
        );
      }}
    </FieldWrapper>
  );
}
