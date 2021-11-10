import { FormikProps } from "formik";
import NumberFormat, { NumberFormatValues } from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface NumberFieldProps extends LabelWrapperParams {
  readOnly?: boolean;

  /** Extra validation to prevent invalid numbers being written. */
  isAllowed?: (values: NumberFormatValues) => boolean;
  onChangeExternal?: (
    form: FormikProps<any>,
    name: string,
    value: number | null
  ) => void;

  /** Disables decimal places. */
  isInteger?: boolean;

  placeholder?: string;
}

/** Input field that only accepts a number. */
export function NumberField(props: NumberFieldProps) {
  const { name, onChangeExternal, isInteger, placeholder } = props;
  return (
    <FieldWrapper {...props}>
      {({ formik, setValue, value }) => {
        function onValueChange({ floatValue }: NumberFormatValues) {
          const numValue = typeof floatValue === "number" ? floatValue : null;
          setValue(numValue);
          onChangeExternal?.(formik, name, numValue);
        }

        const numberFormatValue =
          typeof value === "number"
            ? value
            : typeof value === "string"
            ? Number(value)
            : "";

        return (
          <NumberFormat
            isAllowed={props.isAllowed}
            className="form-control"
            onValueChange={onValueChange}
            readOnly={props.readOnly}
            decimalScale={isInteger ? 0 : undefined}
            value={numberFormatValue}
            placeholder={placeholder}
          />
        );
      }}
    </FieldWrapper>
  );
}
