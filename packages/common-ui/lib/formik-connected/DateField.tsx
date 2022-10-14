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
}

export const DATE_REGEX_NO_TIME = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_REGEX_PARTIAL = /^\d{4}(-\d{2}){0,2}$/;

/** Formik-connected date input. */
export function DateField(props: DateFieldProps) {
  const { showTime, disabled, partialDate } = props;

  const { formatMessage } = useIntl();

  function validate(value: unknown) {
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

        function onBlur(event: FocusEvent<HTMLInputElement, Element>) {
          const newText = event.target.value;

          const error = validate?.(newText);
          if (error !== undefined) {
            formik.setFieldError(props.name, error);
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
                placeholderText: "YYYY-MM-DD",
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
