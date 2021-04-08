import NumberFormat, { NumberFormatValues } from "react-number-format";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface NumberFieldProps extends LabelWrapperParams {
  readOnly?: boolean;

  /** Extra validation to prevent invalid numbers being written. */
  isAllowed?: (values: NumberFormatValues) => boolean;
}

/** Input field that only accepts a number. */
export function NumberField(props: NumberFieldProps) {
  return (
    <FieldWrapper {...props}>
      {({ setValue, value }) => {
        function onValueChange({ floatValue }: NumberFormatValues) {
          setValue(typeof floatValue === "number" ? floatValue : null);
        }

        return (
          <NumberFormat
            isAllowed={props.isAllowed}
            className="form-control"
            onValueChange={onValueChange}
            readOnly={props.readOnly}
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
    </FieldWrapper>
  );
}
