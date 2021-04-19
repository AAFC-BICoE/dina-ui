import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface TextFieldProps extends LabelWrapperParams {
  readOnly?: boolean;
  initialValue?: string;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<any> | TextareaHTMLAttributes<any>;
  placeholder?: string;

  customInput?: (inputProps: InputHTMLAttributes<any>) => JSX.Element;
  onChangeExternal?: (name, value) => void;
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
    onChangeExternal,
    ...labelWrapperProps
  } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ setValue, value }) => {
        function onChangeInternal(newValue: string) {
          setValue(newValue);
          onChangeExternal?.(props.name, newValue);
        }

        const inputPropsInternal: InputHTMLAttributes<any> = {
          ...inputPropsExternal,
          placeholder,
          className: "form-control",
          onChange: event => onChangeInternal(event.target.value),
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
