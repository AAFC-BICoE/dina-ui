import { clamp, isEqual } from "lodash";
import { all, create, MathJsStatic, BigNumber } from "mathjs";
import { ChangeEvent, useEffect, useState } from "react";
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
  const [inputVal, setInputVal] = useState("");

  const MAX_DECIMAL_PLACES = 2;

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const newVal = event.target.value;

    setInputVal(newVal);

    const metersVal = toMeters(newVal, MAX_DECIMAL_PLACES);
    inputProps.onChange?.({
      target: { value: metersVal?.toString() ?? newVal }
    } as ChangeEvent<HTMLInputElement>);
  }

  // When the outer form state changes, set the inner text state:
  useEffect(() => {
    const formStateVal = inputProps.value?.toString() ?? "";
    if (!isEqual(toMeters(formStateVal), toMeters(inputVal))) {
      setInputVal(formStateVal);
    }
  }, [inputProps.value]);

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
math.config({
  // Use BigNumber to retain trailing zeroes:
  number: "BigNumber"
});

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

const NUMBERS_ONLY_REGEX = /^\s*([\d|\.]+)\s*$/;

/** Returns a string if the conversion can be done, otherwise returns null. */
export function toMeters(
  text: string,
  maxDecimalPlaces?: number
): string | null {
  const numberOnlyMatch = NUMBERS_ONLY_REGEX.exec(text);
  if (numberOnlyMatch) {
    return toMeters(`${text} meters`, maxDecimalPlaces);
  }

  // Special case matcher for "x feet x inches" -formatted text:
  const feetInchMatch = FEET_INCH_REGEX.exec(text);
  if (feetInchMatch) {
    const [_, feet, __, inches] = feetInchMatch;
    return toMeters(`${feet} feet + ${inches} inches`, maxDecimalPlaces);
  }

  try {
    const inMeters = math
      .evaluate(text.toLowerCase())
      .toNumber("m") as BigNumber;
    const decimalPlaces = math.bignumber(inMeters).decimalPlaces();
    return maxDecimalPlaces !== undefined
      ? inMeters.toFixed(clamp(decimalPlaces, maxDecimalPlaces))
      : String(inMeters);
  } catch (error) {
    return null;
  }
}
