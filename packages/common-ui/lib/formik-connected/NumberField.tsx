import { FastField, FieldProps } from "formik";
import { ChangeEvent, ChangeEventHandler, useRef } from "react";
import NumberFormat, { NumberFormatValues } from "react-number-format";
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
              customInput={InputWithErrorNotify}
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

/**
 * Wraps the normal input onChange function to show a red outline around the input when
 * the NumberFormat blocks invalid input.
 */
function InputWithErrorNotify(inputProps) {
  const inputRef = useRef<HTMLInputElement>();

  function onChangeWithErrorNotify(event: ChangeEvent<HTMLInputElement>) {
    const inputValue = event.target.value;
    inputProps.onChange?.(event);
    const actualValue = event.target.value;

    // When the user input is blocked then notify the user with a red outline around the input:
    const input = inputRef.current;
    if (inputValue !== actualValue && input) {
      input.className = input.className + " is-invalid";
      setTimeout(
        () => (input.className = input.className.replace(" is-invalid", "")),
        1000
      );
    }
  }

  return (
    <input {...inputProps} ref={inputRef} onChange={onChangeWithErrorNotify} />
  );
}
