import { Field, FieldProps } from "formik";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: LabelParams) {
  const { className, label, name } = props;

  return (
    <Field name={name}>
      {({ field: { value } }: FieldProps) => (
        <FieldWrapper className={className} label={label} name={name}>
          <p
            style={{
              borderBottom: "1px solid black",
              borderRight: "1px solid black",
              minHeight: "25px"
            }}
          >
            {value}
          </p>
        </FieldWrapper>
      )}
    </Field>
  );
}
