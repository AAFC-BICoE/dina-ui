import titleCase from "title-case";

export interface LabelParams {
  /** The CSS classes of the div wrapper. */
  className?: string;

  /** The name of the field. */
  name: string;

  /** The label for the field. */
  label?: string;
}

export interface FieldWrapperProps extends LabelParams {
  children: JSX.Element;
}

/**
 * Wraps a field with a label of the field's name. The label can be auto-generated as a title-case
 * version of the field name, or can be specified as a custom label string.
 */
export function FieldWrapper({
  className,
  name,
  label = titleCase(name),
  children
}: FieldWrapperProps) {
  return (
    <div className={className}>
      <div className="form-group">
        <label>
          <strong>{label}:</strong>
        </label>
        {children}
      </div>
    </div>
  );
}
