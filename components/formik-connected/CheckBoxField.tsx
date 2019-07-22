import { Field } from "formik";
import { noop } from "lodash";

interface CheckBoxFieldProps {
  onClick?: (e: MouseEvent) => void;
  name: string;
}

export function CheckBoxField({ onClick = noop, name }: CheckBoxFieldProps) {
  return (
    <Field name={name}>
      {({ field: { value }, form: { setFieldValue, setFieldTouched } }) => {
        function onClickInner(e) {
          setFieldValue(name, e.target.checked);
          setFieldTouched(name);
          onClick(e);
        }

        return (
          <input
            checked={value}
            onClick={onClickInner}
            onChange={noop}
            style={{ height: "20px", width: "20px" }}
            type="checkbox"
            value={value}
          />
        );
      }}
    </Field>
  );
}
