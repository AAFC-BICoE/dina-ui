import classnames from "classnames";
import moment from "moment";
import { ComponentProps, FocusEvent, SyntheticEvent } from "react";
import DatePicker from "react-datepicker";
import { useIntl } from "react-intl";
import { FieldWrapperProps } from "..";
import { DateView } from "../date/DateView";
import { FieldWrapper } from "./FieldWrapper";

export interface DateFieldProps extends FieldWrapperProps {
  /**
   * While the date field requires a YYYY-MM-DD format, enabling this option will allow for
   * partial dates like: YYYY-MM or YYYY by itself.
   *
   * This is useful for elasticsearch since it's able to handle these cases.
   */
  partialDate?: boolean;
  showTime?: boolean;
  disabled?: boolean;
  showPlaceholder?: boolean;
  skipValidation?: boolean;
}

export const DATE_REGEX_NO_TIME = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_REGEX_PARTIAL = /^\d{4}(-\d{2}){0,2}$/;

/** Formik-connected date input. */
export function DateField(props: DateFieldProps) {
  const {
    showTime,
    disabled,
    partialDate,
    showPlaceholder = true,
    skipValidation = false
  } = props;

  const { formatMessage } = useIntl();

  function validate(value: unknown) {
    if (skipValidation) {
      return;
    }

    if (value && typeof value === "string") {
      if (!showTime) {
        if (partialDate) {
          // In partial date mode, the following is supported: YYYY-MM-DD, YYYY-MM and YYYY.
          if (!DATE_REGEX_PARTIAL.test(value)) {
            return formatMessage({ id: "dateMustBeFormattedPartial" });
          }
        } else {
          if (!DATE_REGEX_NO_TIME.test(value)) {
            return formatMessage({ id: "dateMustBeFormattedYyyyMmDd" });
          }
        }

        // Check for invalid dates like 2021-02-29
        const parsed = moment(value, true);
        if (!parsed.isValid()) {
          return `${formatMessage({ id: "invalidDate" })}: ${value}`;
        }
      }
    }
  }

  return (
    <FieldWrapper
      {...props}
      readOnlyRender={(val) => (showTime ? <DateView date={val} /> : val)}
      validate={validate}
      disableLabelClick={true} // Stops the datepicker from staying open after choosing a date.
    >
      {({ formik, invalid, setValue, value }) => {
        function onChange(
          date: Date | null,
          event?: SyntheticEvent<any, Event>
        ) {
          // When selecting from the date picker:
          if (!event || event?.type === "click" || event?.type === "keydown") {
            setValue(
              date && date.toISOString().slice(0, showTime ? undefined : 10)
            );
          }
        }

        function onChangeRaw(event: FocusEvent<HTMLInputElement>) {
          // When typing into the input:
          if (event?.type === "change") {
            let newText = event.target.value;
            const dashOccurences = newText.split("-").length - 1;
            if (newText.length === 8 && dashOccurences === 0) {
              newText =
                newText.slice(0, 4) +
                "-" +
                newText.slice(4, 6) +
                "-" +
                newText.slice(6);
            }

            setValue(newText);
          }
        }

        function onBlur(event: FocusEvent<HTMLInputElement>) {
          const newText = event.target.value;

          // Run the existing validation first.
          const error = validate?.(newText);
          if (error) {
            formik.setFieldError(props.name, error);
            return;
          }

          // If the input text is not empty, try to parse and reformat it.
          if (newText) {
            const parsedDate = moment(newText);
            if (parsedDate.isValid()) {
              // If parsing is successful, format the date into the canonical ISO string.
              // Use the full string if showTime is true, otherwise use only the date part.
              const formattedValue = parsedDate
                .toDate()
                .toISOString()
                .slice(0, showTime ? undefined : 10);

              // Update the form's state with the correctly formatted value.
              setValue(formattedValue);

              // Clear any previous validation errors for this field.
              if (formik.errors[props.name]) {
                formik.setFieldError(props.name, undefined);
              }
            } else {
              // If the input is not a valid date, set a field error.
              formik.setFieldError(
                props.name,
                `${formatMessage({ id: "invalidDate" })}: ${newText}`
              );
            }
          } else {
            // If the field was cleared, set the value to null.
            setValue(null);
          }
        }

        // Date object or null is needed by datepicker:
        const parsedValue = value ? moment(value, true) : null;
        const dateObject = parsedValue?.isValid() ? parsedValue.toDate() : null;

        // Props that depend on "showTime":
        const datePickerProps: Partial<ComponentProps<typeof DatePicker>> =
          showTime
            ? {
                dateFormat: "Pp",
                showTimeSelect: true
              }
            : {
                dateFormat: "yyyy-MM-dd",
                placeholderText: showPlaceholder ? "YYYY-MM-DD" : "",
                value // The text value in the input element.
              };

        return (
          <div className={classnames(invalid && "is-invalid")}>
            <DatePicker
              className={classnames("form-control", invalid && "is-invalid")}
              wrapperClassName="w-100"
              isClearable={!disabled}
              onChange={onChange}
              onChangeRaw={onChangeRaw}
              showYearDropdown={true}
              todayButton="Today"
              disabled={disabled}
              onBlur={onBlur}
              onFocus={(event) => event.target.select()}
              selected={dateObject}
              {...datePickerProps}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
