import { all, create, MathJsStatic } from "mathjs";
import { ChangeEvent, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";

export function MetersField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      customInput={inputProps => <MetersFieldInternal {...inputProps} />}
    />
  );
}

function MetersFieldInternal(inputProps: React.InputHTMLAttributes<any>) {
  // The value that shows up in the input. Stores the non-meters value (e.g. feet) while the user is typing.
  const [inputVal, setInputVal] = useState(String(inputProps.value ?? ""));

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const newVal = event.target.value;

    setInputVal(newVal);

    const metersVal = toMeters(newVal);
    inputProps.onChange?.({
      target: { value: metersVal?.toString() ?? newVal }
    } as ChangeEvent<HTMLInputElement>);
  }

  return (
    <input
      {...inputProps}
      value={inputVal}
      onChange={onChange}
      // On blur show the value as meters in the input:
      onBlur={() => setInputVal(String(inputProps.value ?? ""))}
      type="text"
    />
  );
}

const math = create(all) as MathJsStatic;
math.createUnit("yds", "1 yd");

// French units:
math.createUnit("pd", "1 foot");
math.createUnit("pied", "1 foot");
math.createUnit("pieds", "1 foot");
math.createUnit("po", "1 inch");
math.createUnit("pouce", "1 inch");
math.createUnit("pouces", "1 inch");
math.createUnit("metre", "1 meter");
math.createUnit("metres", "1 meter");
math.createUnit("centimetre", "1 centimeter");
math.createUnit("centimetres", "1 centimeter");
math.createUnit("millimetre", "1 millimeter");
math.createUnit("millimetres", "1 millimeter");

const FEET_INCH_REGEX =
  /\s*([\d|\.]+)\s*(feet|foot|ft|pieds|pied|pd)\s*([\d|\.]+)\s*(inches|inch|in|pouces|pouce|po)\s*/i;

/** Returns a string if the conversion can be done, otherwise returns null. */
export function toMeters(text: string): number | null {
  // Special case matcher for "x feet x inches" -formatted text:
  const feetInchMatch = FEET_INCH_REGEX.exec(text);
  if (feetInchMatch) {
    const [_, feet, __, inches] = feetInchMatch;
    const feetInMeters = toMeters(`${feet} feet`);
    const inchesInMeters = toMeters(`${inches} inches`);
    if (feetInMeters && inchesInMeters) {
      return feetInMeters + inchesInMeters;
    }
  }

  try {
    return math.unit(text.toLowerCase()).toNumber("m");
  } catch (error) {
    return null;
  }
}
