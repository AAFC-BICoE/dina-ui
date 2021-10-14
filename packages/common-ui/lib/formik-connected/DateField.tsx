import { KeyboardEvent } from "react";
import DatePicker from "react-datepicker";
import { DateView } from "../date/DateView";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";
import classnames from "classnames";

export interface DateFieldProps {
  showTime?: boolean;
  disabled?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams & DateFieldProps) {
  const { showTime, disabled, onKeyDown } = props;

  return (
    <FieldWrapper
      {...props}
      readOnlyRender={val => (showTime ? <DateView date={val} /> : val)}
    >
      {({ setValue, value, invalid }) => {
        function onChange(date: Date) {
          if (showTime) {
            setValue(date && date.toISOString());
          } else {
            setValue(date && date.toISOString().slice(0, 10));
          }
        }

        return (
          <div>
            <DatePicker
              className={classnames("form-control", invalid && "is-invalid")}
              wrapperClassName="w-100"
              dateFormat={showTime ? "Pp" : "yyyy-MM-dd"}
              isClearable={!disabled}
              onChange={onChange}
              selected={
                value
                  ? showTime
                    ? new Date(`${value}`)
                    : new Date(`${value}T12:00:00Z`)
                  : null
              }
              showTimeSelect={showTime}
              showYearDropdown={true}
              todayButton="Today"
              disabled={disabled}
              onKeyDown={onKeyDown}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
