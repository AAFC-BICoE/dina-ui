import { useCallback } from "react";
import { CheckBoxField } from "../../../../common-ui/lib";
import { WorkbookFieldSelectField } from "./WorkbookFieldSelectField";

export interface ColumnMappingRowProps {
  columnName: string;
  columnIndex: number;
  fieldOptions: {
    label: string;
    value?: string;
    options?: {
      label: string;
      value: string;
      parentPath: string;
    }[];
  }[];
  onFieldMappingChange: (columnName: string, newFieldPath) => void;
}

export function ColumnMappingRow({
  columnName,
  columnIndex,
  fieldOptions,
  onFieldMappingChange
}: ColumnMappingRowProps) {
  const onFieldChanged = useCallback((newFieldPath: string) => {
    onFieldMappingChange(columnName, newFieldPath);
  }, []);

  return (
    <div className="row">
      <div className="col-md-4 d-flex align-items-center justify-content-start">
        {columnName}
      </div>
      <div className="col-md-6">
        <WorkbookFieldSelectField
          columnIndex={columnIndex}
          fieldOptions={fieldOptions}
          onFieldChanged={onFieldChanged}
        />
      </div>
      <div className="col-md-2 d-flex align-items-center">
        <CheckBoxField
          name={`fieldMap[${columnIndex}].skipped`}
          hideLabel={true}
        />
      </div>
    </div>
  );
}
