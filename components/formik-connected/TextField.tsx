import { Field } from "formik";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export function TextField(props: LabelParams) {
  const { className, name, label } = props;

  return (
    <FieldWrapper className={className} name={name} label={label}>
      <Field name={name} className="form-control" />
    </FieldWrapper>
  );
}
