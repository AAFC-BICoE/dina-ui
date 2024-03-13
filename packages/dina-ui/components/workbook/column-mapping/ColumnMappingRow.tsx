import { useCallback, useMemo, useState } from "react";
import { CheckBoxField } from "../../../../common-ui/lib";
import { useWorkbookContext } from "../WorkbookProvider";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import {
  THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP,
  useWorkbookConverter
} from "../utils/useWorkbookConverter";
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
  onToggleColumnMapping: (
    columnName: string,
    fieldPath: string,
    checked: boolean
  ) => void;
  onFieldMappingChange: (columnName: string, newFieldPath) => void;
}

export function ColumnMappingRow({
  sheet,
  selectedType,
  columnName,
  columnIndex,
  fieldOptions,
  onToggleColumnMapping,
  onFieldMappingChange
}: ColumnMappingRowProps) {
  const { spreadsheetData, columnUniqueValues, workbookColumnMap } =
    useWorkbookContext();

  const { isFieldInALinkableRelationshipField } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType || "material-sample"
  );

  const [checked, setChecked] = useState<boolean>(false);

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
  }, [sheet]);

  function showMapRelationshipCheckbox(
    colIndex,
    fieldPathInternal?: string
  ): boolean {
    if (
      fieldPathInternal &&
      fieldPathInternal.startsWith("parentMaterialSample.")
    ) {
      return false;
    } else if (
      columnUniqueValues &&
      headers &&
      fieldPathInternal &&
      isFieldInALinkableRelationshipField(fieldPathInternal)
    ) {
      return (
        Object.keys(columnUniqueValues[sheet][headers[colIndex]]).length <=
        THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP
      );
    } else {
      return false;
    }
  }

  const onFieldChanged = useCallback((newFieldPath: string) => {
    setChecked(false);
    onFieldMappingChange(columnName, newFieldPath);
  }, []);

  const fieldPath = workbookColumnMap[columnName]?.fieldPath;
  return (
    <div className="row">
      <div className="col-md-3 d-flex align-items-center justify-content-start">
        {columnName}
      </div>
      <div className="col-md-6">
        <WorkbookFieldSelectField
          columnIndex={columnIndex}
          fieldOptions={fieldOptions}
          onFieldChanged={onFieldChanged}
        />
      </div>
      <div className="col-md-1 d-flex align-items-center">
        <CheckBoxField
          name={`fieldMap[${columnIndex}].skipped`}
          hideLabel={true}
        />
      </div>
      <div className="col-md-2 d-flex align-items-center">
        {showMapRelationshipCheckbox(columnIndex, fieldPath) && (
          <input
            type="checkbox"
            className="mb-2"
            id={`${columnName}-map-relationship`}
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              onToggleColumnMapping?.(columnName, fieldPath!, e.target.checked);
            }}
            style={{
              height: "20px",
              width: "20px"
            }}
          />
        )}
      </div>
    </div>
  );
}
