import { Field } from "formik";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */
export function TextField(props: LabelParams) {
  const { className, name, label } = props;

  return (
    <FieldWrapper className={className} name={name} label={label}>
      <Field name={name} className="form-control" />
    </FieldWrapper>
  );
}
