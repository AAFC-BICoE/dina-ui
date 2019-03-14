import { Field } from "formik";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export function TextField(props: LabelParams) {
  const { className, field, label } = props;

  return (
    <FieldWrapper className={className} field={field} label={label}>
      <Field name={field} className="form-control" />
    </FieldWrapper>
  );
}
