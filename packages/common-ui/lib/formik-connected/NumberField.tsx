import NumberFormat, { NumberFormatValues } from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface NumberFieldProps extends LabelWrapperParams {
  readOnly?: boolean;

  /** Extra validation to prevent invalid numbers being written. */
  isAllowed?: (values: NumberFormatValues) => boolean;
  onChangeExternal?: (name, value) => void;
}

/** Input field that only accepts a number. */
export function NumberField(props: NumberFieldProps) {
  const { name, readOnly, onChangeExternal } = props;
  return (
    <FieldWrapper {...props}>
      {({ setValue, value }) => {
        function onValueChange({ floatValue }: NumberFormatValues) {
          const numValue = typeof floatValue === "number" ? floatValue : null;
          setValue(numValue);
          onChangeExternal?.(name, numValue);
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
            value={numberFormatValue}
          />
        );
      }}
    </FieldWrapper>
  );
}
