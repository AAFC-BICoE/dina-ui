import { Field, FieldProps } from "formik";
import NumberFormat from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

/** Input field that only accepts a number. */
export function NumberField(props: LabelWrapperParams) {
  const { name } = props;

  return (
    <FieldWrapper {...props}>
      <Field name={name}>
        {({
          field: { value },
          form: { setFieldValue, setFieldTouched }
        }: FieldProps) => {
          function onValueChange({ floatValue }) {
            setFieldValue(
              name,
              typeof floatValue === "number" ? floatValue : null
            );
            setFieldTouched(name);
          }

          return (
            <NumberFormat
              className="form-control"
              onValueChange={onValueChange}
              value={value}
            />
          );
        }}
      </Field>
    </FieldWrapper>
  );
}
