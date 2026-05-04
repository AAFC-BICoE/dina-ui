import { FormikProps } from "formik";
import _ from "lodash";
import { ChangeEvent, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { TextField, TextFieldProps } from "./TextField";

export function DOIField(props: TextFieldProps) {
  const { formatMessage } = useIntl();

  /** Only allow values that start with https://doi.org/ or blank values. */
  function validate(val: any) {
    const valString = val?.toString?.()?.trim();
    return !valString || valString.startsWith("https://doi.org/")
      ? undefined
      : formatMessage({ id: "invalidDOIValue" });
  }

  return (
    <TextField
      {...props}
      validate={validate}
      customInput={(inputProps, formik) => (
        <DOIFieldInternal
          {...inputProps}
          validate={validate}
          name={props.name}
          formik={formik}
        />
      )}
    />
  );
}

function DOIFieldInternal({
  name,
  formik,
  validate,
  ...inputProps
}: React.InputHTMLAttributes<any> & {
  name: string;
  formik: FormikProps<any>;
  validate: (val: any) => string | void;
}) {
  // The value that shows up in the input.
  const [inputVal, setInputVal] = useState("");

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const newVal = event.target.value;
    setInputVal(newVal);
    inputProps.onChange?.(event);
  }

  // When the outer form state changes, set the inner text state:
  useEffect(() => {
    const formStateVal = inputProps.value?.toString() ?? "";
    if (!_.isEqual(formStateVal, inputVal)) {
      setInputVal(formStateVal);
    }
  }, [inputProps.value]);

  return (
    <input
      {...inputProps}
      value={inputVal}
      onChange={onChange}
      // On blur validate and show error:
      onBlur={() => {
        const newInputVal = String(inputProps.value ?? "");
        setInputVal(newInputVal);

        const error = validate(newInputVal);
        if (error) {
          formik.setFieldError(name, error);
        }
      }}
      type="text"
    />
  );
}
