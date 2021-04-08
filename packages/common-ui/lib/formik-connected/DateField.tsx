import DatePicker from "react-datepicker";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface DateFieldProps {
  showTime?: boolean;
  disabled?: boolean;
}

/** Formik-connected date input. */
export function DateField(props: LabelWrapperParams & DateFieldProps) {
  const { showTime, disabled } = props;

  return (
    <FieldWrapper {...props}>
      {({ setValue, value }) => {
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
              className="form-control"
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
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
