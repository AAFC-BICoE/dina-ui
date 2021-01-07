import { FastField, FieldProps } from "formik";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface TextFieldProps extends LabelWrapperParams {
  readOnly?: boolean;
  initialValue?: string;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<any> | TextareaHTMLAttributes<any>;
  placeholder?: string;
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
          function onChange(event) {
            setFieldValue(name, event.target.value);
            setFieldTouched(name);
          }

          const inputPropsInternal = {
            ...inputPropsExternal,
            className: "form-control",
            onChange,
            value: value || "",
            readOnly
          };

          // The default Field component's inner text input needs to be replaced with our own
          // controlled input that we manually pass the "onChange" and "value" props. Otherwise
          // we will get React's warning about switching from an uncontrolled to controlled input.
          return multiLines ? (
            <textarea rows={4} {...inputPropsInternal} />
          ) : (
            <input
              {...inputPropsInternal}
              type="text"
              placeholder={placeholder}
            />
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
