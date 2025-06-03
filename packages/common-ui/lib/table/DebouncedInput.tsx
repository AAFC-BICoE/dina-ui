import _ from "lodash";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceTime = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounceTime?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);

  const debouncedOnChange = useRef(
    _.debounce((valueParam) => {
      onChange(valueParam);
    }, debounceTime)
  ).current;

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    debouncedOnChange(value);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
