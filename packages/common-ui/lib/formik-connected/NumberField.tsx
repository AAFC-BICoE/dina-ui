import { FastField, FieldProps } from "formik";
import NumberFormat from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface NumberFieldProps extends LabelWrapperParams {
  readOnly?: boolean;
}

/** Input field that only accepts a number. */
export function NumberField(props: NumberFieldProps) {
  const { name, readOnly } = props;

  return (
    <FieldWrapper {...props}>
      <FastField name={name}>
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
              readOnly={readOnly}
              value={
                typeof value === "number"
                  ? value
                  : typeof value === "string"
                  ? Number(value)
                  : ""
              }
            />
          );
        }}
      </FastField>
    </FieldWrapper>
  );
}
