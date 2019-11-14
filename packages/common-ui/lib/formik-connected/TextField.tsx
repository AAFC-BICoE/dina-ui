import { Field, FieldProps } from "formik";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */

export interface TextFieldProps {
  readOnly?: boolean;
  initialValue?: string | string[];
}

export function TextField(props: LabelWrapperParams & TextFieldProps) {
  const {
    className,
    name,
    label,
    tooltipMsg,
    hideLabel,
    readOnly,
    initialValue
  } = props;

  return (
    <FieldWrapper
      className={className}
      name={name}
      label={label}
      tooltipMsg={tooltipMsg}
      hideLabel={hideLabel}
    >
      <Field name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          function onChange(event) {
            setFieldValue(name, event.target.value);
            setFieldTouched(name);
          }

          // The default Field component's inner text input needs to be replaced with our own
          // controlled input that we manually pass the "onChange" and "value" props. Otherwise
          // we will get React's warning about switching from an uncontrolled to controlled input.
          return (
            <input
              className="form-control"
              onChange={onChange}
              type="text"
              value={initialValue ? initialValue : value || ""}
              readOnly={readOnly}
            />
          );
        }}
      </Field>
    </FieldWrapper>
  );
}
