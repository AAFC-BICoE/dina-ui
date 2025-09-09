import { ChangeEvent, FocusEvent } from "react";
import { useIntl } from "react-intl";
import * as yup from "yup";
import { ClearType, TextField, TextFieldProps } from "..";

export interface NumberFieldProps extends TextFieldProps {
  placeholder?: string;

  min?: number;
  max?: number;
  isInteger?: boolean;
}

/** Input field for a number. */
export function NumberField(props: NumberFieldProps) {
  const { formatMessage } = useIntl();

  function validate(value: unknown) {
    let validator = yup.number().nullable().notRequired();
    if (props.min !== undefined) {
      validator = validator.min(props.min);
    }
    if (props.max !== undefined) {
      validator = validator.max(props.max);
    }
    if (props.isInteger) {
      validator = validator
        .integer()
        .typeError(formatMessage({ id: "mustBeValidIntegerValue" }));
    } else {
      validator = validator.typeError(
        formatMessage({ id: "mustBeValidDecimalValue" })
      );
    }

    if (value && typeof value === "string") {
      try {
        validator.validateSync(value);
      } catch (error: unknown) {
        if (error instanceof yup.ValidationError) {
          return error.message;
        }
      }
    }
  }

  return (
    <TextField
      {...props}
      validate={validate}
      clearType={ClearType.Null}
      customInput={(inputProps, formik) => {
        function onBlur(event: FocusEvent<HTMLInputElement>) {
          const error = validate?.(event.target.value);
          if (error) {
            formik.setFieldError(props.name, error);
          }
        }

        function onChange(e: ChangeEvent<HTMLInputElement>) {
          const isBlank = e.target.value === "";
          inputProps.onChange?.(
            isBlank ? ({ target: { value: null } } as any) : e
          );
        }

        return (
          <input
            type="text"
            {...inputProps}
            onBlur={onBlur}
            onChange={onChange}
          />
        );
      }}
    />
  );
}
