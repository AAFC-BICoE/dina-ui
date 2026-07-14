import classnames from "classnames";
import { ChangeEvent, InputHTMLAttributes } from "react";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";

export interface FormattedTextFieldProps extends FieldWrapperProps {
  readOnly?: boolean;
  initialValue?: string;
  multiLines?: boolean;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  placeholder?: string;
}

/**
 * Replicates the old Cleave masking configuration:
 * numericOnly: true
 * blocks: [4, 2, 2, 2, 2, 2, 3]
 * delimiters: ["-", "-", "T", ":", ":", "."]
 *
 * AI assisted to remove the Cleave dependency. Ensured the test cases are still passing and
 * tested it out to ensure the same functionality as before.
 */
function formatDateTimeMask(rawValue: string): string {
  // Strip out any non-numeric characters (numericOnly: true)
  const digits = rawValue.replace(/\D/g, "");

  const blocks = [4, 2, 2, 2, 2, 2, 3];
  const delimiters = ["-", "-", "T", ":", ":", "."];

  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < blocks.length; i++) {
    const blockSize = blocks[i];
    const blockDigits = digits.slice(digitIndex, digitIndex + blockSize);

    result += blockDigits;
    digitIndex += blockDigits.length;

    // If the current block is complete and there are more digits left, append the delimiter
    if (blockDigits.length === blockSize && digitIndex < digits.length) {
      if (delimiters[i]) {
        result += delimiters[i];
      }
    } else {
      break;
    }
  }

  return result;
}

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
        const onChange = (event: ChangeEvent<HTMLInputElement>) => {
          const formatted = formatDateTimeMask(
            (event.target as HTMLTextAreaElement | HTMLInputElement).value
          );
          // Standardizing empty strings to null matches modern form data expectations
          setValue(formatted === "" ? null : formatted);
        };

        const inputPropsInternal = {
          ...inputPropsExternal,
          className: classnames(
            "form-control",
            { "is-invalid": invalid },
            inputPropsExternal?.className
          ),
          onChange,
          value: value ?? "",
          readOnly
        };

        return (
          <input
            type="text"
            {...inputPropsInternal}
            placeholder={placeholder}
          />
        );
      }}
    </FieldWrapper>
  );
}
