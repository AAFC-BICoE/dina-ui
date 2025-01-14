import classnames from "classnames";
import Cleave from "cleave.js/react";
import { InputHTMLAttributes } from "react";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
export interface FormattedTextFieldProps extends FieldWrapperProps {
  readOnly?: boolean;
  initialValue?: string;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<any>;
  placeholder?: string;
}

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */
export function FormattedTextField(props: FormattedTextFieldProps) {
  const {
    readOnly,
    inputProps: inputPropsExternal,
    placeholder,
    ...labelWrapperProps
  } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ setValue, value, invalid }) => {
        const inputPropsInternal = {
          ...inputPropsExternal,
          className: classnames("form-control", { "is-invalid": invalid }),
          onChange: (event) => setValue(event.target.value),
          value: value ?? "",
          readOnly
        };

        return (
          <Cleave
            {...inputPropsInternal}
            placeholder={placeholder}
            options={{
              numericOnly: true,
              blocks: [4, 2, 2, 2, 2, 2, 3],
              delimiters: ["-", "-", "T", ":", ":", "."],
              delimiterLazyShow: true
            }}
          />
        );
      }}
    </FieldWrapper>
  );
}
