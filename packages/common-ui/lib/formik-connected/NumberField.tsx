import { FastField, FieldProps } from "formik";
import NumberFormat from "react-number-format";
import { NumberFormatValues } from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface NumberFieldProps extends LabelWrapperParams {
  readOnly?: boolean;

  /** Extra validation to prevent invalid numbers being written. */
  isAllowed?: (values: NumberFormatValues) => boolean;
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
          function onValueChange({ floatValue }: NumberFormatValues) {
            setFieldValue(
              name,
              typeof floatValue === "number" ? floatValue : null
            );
            setFieldTouched(name);
          }

          return (
            <NumberFormat
              isAllowed={props.isAllowed}
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
