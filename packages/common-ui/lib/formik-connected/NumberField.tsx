import { FastField, FieldProps } from "formik";
import NumberFormat from "react-number-format";
import { NumberFormatValues } from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface NumberFieldProps extends LabelWrapperParams {
  readOnly?: boolean;

  /** Extra validation to prevent invalid numbers being written. */
  isAllowed?: (values: NumberFormatValues) => boolean;
  onChangeExternal?: (form, name, value) => void;
}

/** Input field that only accepts a number. */
export function NumberField(props: NumberFieldProps) {
  const { name, readOnly, onChangeExternal } = props;

  return (
    <FieldWrapper {...props}>
      <FastField name={name}>
        {({ field: { value }, form }: FieldProps) => {
          function onValueChange({ floatValue }: NumberFormatValues) {
            const numValue = typeof floatValue === "number" ? floatValue : null;
            form.setFieldValue(name, numValue);
            form.setFieldTouched(name);
            onChangeExternal?.(form, name, numValue);
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
