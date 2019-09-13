import { FastField, FieldProps } from "formik";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: LabelWrapperParams) {
  const { name } = props;

  return (
    <FastField name={name}>
      {({ field: { value } }: FieldProps) => (
        <FieldWrapper {...props}>
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
    </FastField>
  );
}
