import titleCase from "title-case";

export interface LabelParams {
  className?: string;
  name: string;
  label?: string;
}

export interface FieldWrapperProps extends LabelParams {
  children: JSX.Element;
}

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
