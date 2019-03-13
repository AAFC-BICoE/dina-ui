import { Field } from "formik";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export function TextField(props: LabelParams) {
  const { field } = props;

  return (
    <FieldWrapper {...props}>
      <Field name={field} className="form-control" />
    </FieldWrapper>
  );
}
