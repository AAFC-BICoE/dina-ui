import classnames from "classnames";
import moment from "moment";
import { ComponentProps, FocusEvent, SyntheticEvent, useMemo } from "react";
import DatePicker from "react-datepicker";
import { useIntl } from "react-intl";
import {
  ClearType,
  FieldWrapperProps,
  useBulkEditTabFieldIndicators
} from "..";
import { DateView } from "../date/DateView";
import { FieldWrapper } from "./FieldWrapper";
import { ClearAllButton } from "../bulk-edit/ClearAllButton";

export interface DateFieldProps extends FieldWrapperProps {
  readOnly?: boolean;
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

/**
 * Formik-connected date input.
 *
 * Important note: When using showTime, the timezone handling is done by the browser via the toISOString method.
 * This means that the date and time selected will be converted to UTC before being stored.
 * For example, selecting "2023-10-05 10:00 AM" in a UTC+2 timezone will be stored as "2023-10-05T08:00:00.000Z".
 *
 * This behavior ensures consistency across different user timezones, but it's important to be aware of it
 * when displaying or processing the stored date-time values. But be aware that if the Date being saved is a
 * LocalDate, no timezone information should be saved. This component will need to be refactored to handle that case.
 */
export function DateField(props: DateFieldProps) {
  const {
    readOnly,
    showTime,
    disabled,
    partialDate,
    showPlaceholder = true,
    skipValidation = false,
    disableClearButton = false
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
      {({ formik, invalid, setValue, value, placeholder }) => {
        const bulkTab = useBulkEditTabFieldIndicators({
          fieldName: props.name,
          currentValue: value
        });

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
        const dateObject = useMemo(() => {
          if (!value) {
            return null;
          }

          if (showTime) {
            // With time, parse normally (will include timezone)
            const parsedValue = moment(value, true);
            return parsedValue.isValid() ? parsedValue.toDate() : null;
          } else {
            // For date-only, parse the YYYY-MM-DD string directly to avoid timezone shifts
            const match =
              typeof value === "string"
                ? value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
                : null;
            if (match) {
              const year = parseInt(match[1], 10);
              const month = parseInt(match[2], 10) - 1; // months are 0-indexed
              const day = parseInt(match[3], 10);
              return new Date(year, month, day, 12, 0, 0); // set to noon to avoid timezone issues
            }
            return null;
          }
        }, [value, showTime]);

        // Props that depend on "showTime":
        const datePickerProps: Partial<ComponentProps<typeof DatePicker>> =
          showTime
            ? {
                dateFormat: "Pp",
                showTimeSelect: true,
                placeholderText:
                  placeholder ||
                  (showPlaceholder ? "YYYY-MM-DD, HH:MM AM/PM" : "")
              }
            : {
                dateFormat: "yyyy-MM-dd",
                placeholderText:
                  placeholder || (showPlaceholder ? "YYYY-MM-DD" : ""),
                value // The text value in the input element.
              };

        // Disable while the field when it's in a special state like cleared or deleted.
        const isDisabled =
          disabled ||
          bulkTab?.isExplicitlyCleared ||
          bulkTab?.isExplicitlyDeleted;

        return (
          <div
            className={classnames(
              "d-flex",
              "align-items-center",
              "gap-2",
              invalid && "is-invalid"
            )}
          >
            <DatePicker
              className={classnames("form-control", invalid && "is-invalid")}
              wrapperClassName="w-100"
              isClearable={!isDisabled && !bulkTab}
              onChange={onChange}
              onChangeRaw={onChangeRaw}
              showYearDropdown={true}
              todayButton="Today"
              disabled={isDisabled}
              onBlur={onBlur}
              onFocus={(event) => event.target.select()}
              selected={dateObject}
              {...datePickerProps}
            />
            {bulkTab &&
              !bulkTab?.isExplicitlyDeleted &&
              !disableClearButton && (
                <ClearAllButton
                  fieldName={props.name}
                  clearType={ClearType.Null}
                  onClearLocal={() => setValue(null)}
                  isCleared={!bulkTab?.showClearIcon}
                  readOnly={readOnly}
                />
              )}
          </div>
        );
      }}
    </FieldWrapper>
  );
}
