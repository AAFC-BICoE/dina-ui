import { Field, FieldProps } from "formik";
import titleCase from "title-case";

export interface FieldViewProps {
  /** The name of the field. */
  name: string;

  /** The label for the field. */
  label?: string;
}

export function FieldView(props: FieldViewProps) {
  const { name } = props;

  function InnerFieldComponent({ field: { value } }: FieldProps) {
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
  }

  return (
    <div className="form-group col-md-2">
      <Field name={name} component={InnerFieldComponent} />
    </div>
  );
}
