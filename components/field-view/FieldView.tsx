import { Field, FieldProps } from "formik";
import titleCase from "title-case";

export interface FieldViewProps {
  /** The name of the field. */
  name: string;

  /** The label for the field. */
  label?: string;

  /** The CSS classes of the div wrapper. */
  className?: string;
}

export function FieldView(props: FieldViewProps) {
  const { className, name } = props;

  return (
    <div className={className}>
      <div className="form-group">
        <Field name={name}>
          {({ field: { value } }: FieldProps) => {
            const { label = titleCase(name) } = props;

            return (
              <div>
                <label>
                  <strong>{label}</strong>
                </label>
                <p
                  style={{
                    borderBottom: "1px solid black",
                    borderRight: "1px solid black",
                    minHeight: "25px"
                  }}
                >
                  {value}
                </p>
              </div>
            );
          }}
        </Field>
      </div>
    </div>
  );
}
