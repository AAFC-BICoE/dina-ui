import { useCallback } from "react";
import { CheckBoxField, FieldSpy } from "../../../../common-ui/lib";
import { WorkbookFieldSelectField } from "./WorkbookFieldSelectField";
import { WorkbookColumnInfo } from "../utils/workbookMappingUtils";

export interface ColumnMappingRowProps {
  columnName: WorkbookColumnInfo;
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
  onFieldMappingChange: (columnName: WorkbookColumnInfo, newFieldPath) => void;
  type: string;
}

export function ColumnMappingRow({
  columnName,
  columnIndex,
  fieldOptions,
  onFieldMappingChange,
  type
}: ColumnMappingRowProps) {
  const onFieldChanged = useCallback((newFieldPath: string) => {
    onFieldMappingChange(columnName, newFieldPath);
  }, []);

  return (
    <div className="row">
      <div className="col-md-4 d-flex align-items-center justify-content-start">
        {columnName.columnHeader}
      </div>
      <div className="col-md-6">
        <FieldSpy<boolean> fieldName={`fieldMap[${columnIndex}].skipped`}>
          {(isSkipped) => (
            <WorkbookFieldSelectField
              columnIndex={columnIndex}
              fieldOptions={fieldOptions}
              disabled={isSkipped ?? false}
              onFieldChanged={onFieldChanged}
              type={type}
            />
          )}
        </FieldSpy>
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
