import { FastField, FieldProps } from "formik";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface TextFieldProps extends LabelWrapperParams {
  readOnly?: boolean;
  initialValue?: string;
  multiLines?: boolean;
}

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */
export function TextField(props: TextFieldProps) {
  const { initialValue, readOnly, multiLines, ...labelWrapperProps } = props;
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

          const inputProps = {
            className: "form-control",
            onChange,
            value: value || "",
            readOnly
          };

          // The default Field component's inner text input needs to be replaced with our own
          // controlled input that we manually pass the "onChange" and "value" props. Otherwise
          // we will get React's warning about switching from an uncontrolled to controlled input.
          return multiLines ? (
            <textarea rows={4} {...inputProps} />
          ) : (
            <input {...inputProps} type="text" />
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
