import classnames from "classnames";
import moment from "moment";
import { ComponentProps, FocusEvent, SyntheticEvent } from "react";
import DatePicker from "react-datepicker";
import { useIntl } from "react-intl";
import { FieldWrapperProps } from "..";
import { DateView } from "../date/DateView";
import { FieldWrapper } from "./FieldWrapper";

export interface DateFieldProps extends FieldWrapperProps {
  validate?: (value: unknown) => void;
  showTime?: boolean;
  disabled?: boolean;
}

/**
 * All the dates supported for the user to type.
 *
 * All these formats will be converted to YYYY-MM-DD automatically.
 *
 * For example:
 *
 * 2019         -->   2019-01-01
 * 2019-05      -->   2019-05-01
 * 2019-05-19   -->   2019-05-19
 * 2019/05/19   -->   2019-05-19
 */
const SUPPORTED_DATE_FORMATS = [
  "YYYY-MM-DD",
  "YYYY MM DD",
  "YYYY/MM/DD",
  "YYYY-MM",
  "YYYY MM",
  "YYYY/MM",
  "YYYY"
];

const DATE_REGEX_NO_TIME = /^\d{4}-\d{2}-\d{2}$/;

/** Formik-connected date input. */
export function DateField(props: DateFieldProps) {
  const { showTime, disabled, validate } = props;

  const { formatMessage } = useIntl();

  function defaultValidate(value: unknown) {
    if (value && typeof value === "string") {
      if (!props.showTime) {
        if (!DATE_REGEX_NO_TIME.test(value)) {
          return formatMessage({ id: "dateMustBeFormattedYyyyMmDd" });
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
      readOnlyRender={val => (showTime ? <DateView date={val} /> : val)}
      validate={validate ?? defaultValidate}
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
            setValue(event.target.value);
          }
        }

        function onBlur(event: FocusEvent<HTMLInputElement, Element>) {
          let newText = event.target.value;

          // Partial date support
          newText = moment(newText, SUPPORTED_DATE_FORMATS).format(
            "YYYY-MM-DD"
          );

          const error = validate?.(newText);
          if (error) {
            formik.setFieldError(props.name, error);
          }
          setValue(newText);
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
              onFocus={event => event.target.select()}
              selected={dateObject}
              {...datePickerProps}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
