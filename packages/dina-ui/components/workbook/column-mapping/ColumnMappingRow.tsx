import { useCallback, useMemo } from "react";
import { CheckBoxField } from "../../../../common-ui/lib";
import { useWorkbookContext } from "../WorkbookProvider";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import { getColumnHeaders } from "../utils/workbookMappingUtils";
import { WorkbookFieldSelectField } from "./WorkbookFieldSelectField";

export interface ColumnMappingRowProps {
  sheet: number;
  selectedType: string;
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
  sheet,
  selectedType,
  columnName,
  columnIndex,
  fieldOptions,
  onFieldMappingChange
}: ColumnMappingRowProps) {
  const { spreadsheetData, workbookColumnMap } = useWorkbookContext();

  const { isFieldInALinkableRelationshipField } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType || "material-sample"
  );

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
  }, [sheet]);

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
