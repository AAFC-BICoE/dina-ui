import titleCase from "title-case";

export interface LabelParams {
  className?: string;
  field: string;
  label?: string;
}

export interface FieldWrapperProps extends LabelParams {
  children: JSX.Element;
}

export function FieldWrapper({
  className,
  field,
  label = titleCase(field),
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
