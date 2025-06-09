import { FormikProps } from "formik";
import _ from "lodash";
import { all, BigNumber, create, MathJsStatic } from "mathjs";
import { ChangeEvent, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import accents from "remove-accents";
import * as yup from "yup";
import { TextField, TextFieldProps } from "./TextField";

const metersNumberSchema = yup.number().notRequired().nullable();

export function MetersField(props: TextFieldProps) {
  const { formatMessage } = useIntl();

  /** Only allow numbers or blank values. (This should run after conversion from other units.) */
  function validate(val: any) {
    const valString = val?.toString?.()?.trim();
    return !valString || metersNumberSchema.isValidSync(valString)
      ? undefined
      : formatMessage({ id: "invalidMetersValue" });
  }

  return (
    <TextField
      {...props}
      validate={validate}
      customInput={(inputProps, formik) => (
        <MetersFieldInternal
          {...inputProps}
          validate={validate}
          name={props.name}
          formik={formik}
        />
      )}
    />
  );
}

function MetersFieldInternal({
  name,
  formik,
  validate,
  ...inputProps
}: React.InputHTMLAttributes<any> & {
  name: string;
  formik: FormikProps<any>;
  validate: (val: any) => string | void;
}) {
  // The value that shows up in the input. Stores the non-meters value (e.g. feet) while the user is typing.
  const [inputVal, setInputVal] = useState("");

  const MAX_DECIMAL_PLACES = 2;

  /** Convert the input to meters format. */
  function convertInput(text: string) {
    return toMeters(text, MAX_DECIMAL_PLACES);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const newVal = event.target.value;

    setInputVal(newVal);

    const metersVal = convertInput(newVal);
    inputProps.onChange?.({
      target: { value: metersVal?.toString() ?? newVal }
    } as ChangeEvent<HTMLInputElement>);
  }

  // When the outer form state changes, set the inner text state:
  useEffect(() => {
    const formStateVal = inputProps.value?.toString() ?? "";
    if (!_.isEqual(convertInput(formStateVal), convertInput(inputVal))) {
      setInputVal(formStateVal);
    }
  }, [inputProps.value]);

  return (
    <input
      {...inputProps}
      value={inputVal}
      onChange={onChange}
      // On blur show the value as meters in the input:
      onBlur={() => {
        const newInputVal = String(inputProps.value ?? "");
        setInputVal(newInputVal);

        const error = validate(newInputVal);
        if (error) {
          formik.setFieldError(name, error);
        }
      }}
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
math.createUnit("kilometre", "1 kilometer");
math.createUnit("kilometres", "1 kilometer");

const FEET_INCH_REGEX =
  /\s*([\d|\.]+)\s*(feet|foot|ft|pieds|pied|pd)\s*([\d|\.]+)\s*(inches|inch|in|pouces|pouce|po)\s*/i;

/** Unabbreviates units e.g. "ft." to "ft" */
function unAbbreviate(text: string) {
  const UNIT_ABBREVIATION_REGEX = /[a-z]\./gi;
  return text.replace(UNIT_ABBREVIATION_REGEX, (matched) => matched.charAt(0));
}

/** Converts apostrophes and quotes to feet and inches */
function quotesToUnits(text: string) {
  const NUMBER_WITH_APOSTROOPHE_REGEX = /\d\s*\'/gi;
  const NUMBER_WITH_QUOTE_REGEX = /\d\s*\"/gi;

  return text
    .replace(NUMBER_WITH_APOSTROOPHE_REGEX, (match) =>
      match.replace("'", " feet")
    )
    .replace(NUMBER_WITH_QUOTE_REGEX, (match) => match.replace('"', " inches"));
}

const NUMBERS_ONLY_REGEX = /^\s*([\d|\.]+)\s*$/;

const CONTAINS_NUMBERS_REGEX = /([\d|\.]+)/;

/** Returns a string if the conversion can be done, otherwise returns null. */
export function toMeters(
  originalText: string,
  maxDecimalPlaces?: number
): string | null {
  // If the input is just a number:
  const numberOnlyMatch = NUMBERS_ONLY_REGEX.exec(originalText);
  if (numberOnlyMatch) {
    // Retain the original text:
    return originalText;
  }

  // Use regex to fix convdert the text to a format the mathjs parser understands:
  const text = quotesToUnits(
    unAbbreviate(accents.remove(originalText).toLowerCase())
  );

  // Special case matcher for "x feet x inches" -formatted text:
  const feetInchMatch = FEET_INCH_REGEX.exec(text);
  if (feetInchMatch) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, feet, __, inches] = feetInchMatch;
    return toMeters(`${feet} feet + ${inches} inches`, maxDecimalPlaces);
  }

  try {
    // If the input is a number with a known distance unit:
    const inMeters = math.evaluate(text).toNumber("m") as BigNumber;
    const decimalPlaces = math.bignumber(inMeters).decimalPlaces();
    return maxDecimalPlaces !== undefined
      ? inMeters.toFixed(_.clamp(decimalPlaces, maxDecimalPlaces))
      : String(inMeters);
  } catch {
    // If the input contains a number:
    const containsNumbersMatch = CONTAINS_NUMBERS_REGEX.exec(text);
    if (containsNumbersMatch) {
      const [_, matchedNumber] = containsNumbersMatch;
      return toMeters(matchedNumber, maxDecimalPlaces);
    }

    return null;
  }
}
