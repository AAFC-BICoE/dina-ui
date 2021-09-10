import { all, create, MathJsStatic } from "mathjs";
import { FocusEvent } from "react";
import { TextField, TextFieldProps } from "./TextField";

export function MetersField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      customInput={inputProps => {
        function onBlur(event: FocusEvent<HTMLInputElement>) {
          const metersVal = toMeters(event.target.value);
          if (metersVal !== null) {
            inputProps.onChange?.({
              target: { value: String(metersVal) }
            } as any);
          }
          inputProps.onBlur?.(event);
        }
        return <input {...inputProps} onBlur={onBlur} type="text" />;
      }}
    />
  );
}

const math = create(all) as MathJsStatic;
math.createUnit("pd", "1 foot");
math.createUnit("po", "1 inch");

/** Returns a string if the conversion can be done, otherwise returns null. */
export function toMeters(text: string): number | null {
  try {
    return math.unit(text).toNumber("m");
  } catch (error) {
    return null;
  }
}
