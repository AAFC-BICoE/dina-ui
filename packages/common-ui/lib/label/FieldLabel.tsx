import { FieldHeader, FieldNameProps } from "../field-header/FieldHeader";

interface FieldLabelProps extends FieldNameProps {
  className?: string;
}

export default function FieldLabel({
  className,
  ...fieldNameProps
}: FieldLabelProps) {
  return (
    <label className={`field-label label-col ${className}`}>
      {
        <strong>
          <FieldHeader name={fieldNameProps.name} startCaseLabel={true} />
        </strong>
      }
    </label>
  );
}
