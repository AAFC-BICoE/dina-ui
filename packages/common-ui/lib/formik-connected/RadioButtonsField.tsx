import { ReactNode, useMemo, Fragment } from "react";
import { useIntl } from "react-intl";
import { v4 as uuidv4 } from "uuid";
import { FieldWrapper, FieldWrapperProps, Tooltip } from "..";

export interface RadioFieldProps<T> extends FieldWrapperProps {
  options: {
    label: ReactNode;
    value: T;
    disabled?: boolean;
    tooltipLabel?: string;
  }[];

  /** Render horizontally, by default it will be rendered vertically. */
  horizontalOptions?: boolean;

  /** Render as regular html radio inputs (default) or as Bootstrap button group . */
  radioStyle?: "RADIO" | "BUTTONS";
}

export function RadioButtonsField<T = any>({
  options,
  radioStyle = "RADIO",
  horizontalOptions = false,
  ...props
}: RadioFieldProps<T>) {
  const { messages } = useIntl();

  const radioIdPrefix = useMemo(() => uuidv4() as string, []);

  return (
    <FieldWrapper disableLabelClick={true} {...props}>
      {({ value, setValue, placeholder }) => (
        <div>
          {placeholder && (
            <span className="placeholder-text">{placeholder}</span>
          )}
          {radioStyle === "BUTTONS" ? (
            <div className="btn-group" role="group">
              {options.map((option, index) => {
                const id = `radio-${radioIdPrefix}-${index}`;

                return (
                  <Fragment key={index}>
                    <input
                      type="radio"
                      className="btn-check"
                      checked={(value ?? null) === option.value}
                      onChange={() => setValue(option.value)}
                      disabled={option.disabled ?? false}
                      id={id}
                    />
                    {option?.tooltipLabel && messages[option.tooltipLabel] ? (
                      <Tooltip
                        id={
                          messages[option.tooltipLabel]
                            ? option.tooltipLabel
                            : undefined
                        }
                        disableSpanMargin={true}
                        visibleElement={
                          <label
                            className="btn btn-outline-primary"
                            key={index}
                            htmlFor={id}
                          >
                            {option.label}
                          </label>
                        }
                      />
                    ) : (
                      <label
                        className="btn btn-outline-primary"
                        key={index}
                        htmlFor={id}
                      >
                        {option.label}
                      </label>
                    )}
                  </Fragment>
                );
              })}
            </div>
          ) : (
            options.map((option, index) => (
              <div
                className={
                  horizontalOptions ? "form-check-horizontal" : "form-check"
                }
                key={index}
              >
                <label
                  className={
                    option.disabled
                      ? "disabled-radio-text form-check-label"
                      : "form-check-label"
                  }
                >
                  <input
                    className={
                      "form-check-input " + horizontalOptions &&
                      "form-check-input-horizontal"
                    }
                    type="radio"
                    checked={(value ?? null) === option.value}
                    disabled={option.disabled ?? false}
                    onChange={() => setValue(option.value)}
                  />
                  {option?.tooltipLabel && messages[option.tooltipLabel] ? (
                    <Tooltip
                      id={
                        messages[option.tooltipLabel]
                          ? option.tooltipLabel
                          : undefined
                      }
                      disableSpanMargin={true}
                      visibleElement={<>{option.label}</>}
                    />
                  ) : (
                    <>{option.label}</>
                  )}
                </label>
              </div>
            ))
          )}
        </div>
      )}
    </FieldWrapper>
  );
}
