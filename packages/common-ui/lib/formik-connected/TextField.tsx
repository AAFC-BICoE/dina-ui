import { FormikProps } from "formik";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import TextareaAutosize, {
  TextareaAutosizeProps
} from "react-textarea-autosize";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface TextFieldProps extends LabelWrapperParams {
  readOnly?: boolean;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<any> | TextareaHTMLAttributes<any>;
  placeholder?: string;

  customInput?: (inputProps: InputHTMLAttributes<any>) => JSX.Element;
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
    multiLines,
    inputProps: inputPropsExternal,
    placeholder,
    customInput,
    onChangeExternal,
    ...labelWrapperProps
  } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ formik, setValue, value }) => {
        function onChangeInternal(newValue: string) {
          setValue(newValue);
          onChangeExternal?.(formik, props.name, newValue);
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
            <TextareaAutosize
              minRows={4}
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
