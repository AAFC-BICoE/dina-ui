import { FieldHeader, FieldNameProps } from "../field-header/FieldHeader";

export default function FieldLabel(props: FieldNameProps) {
  return (
    <label className={"field-label mb-2 label-col"}>
      {
        <strong>
          <FieldHeader name={props.name} startCaseLabel={true} />
        </strong>
      }
    </label>
  );
}
