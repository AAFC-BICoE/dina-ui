import { useFormikContext } from "formik";
import { startCase } from "lodash";
import { useMemo, useState } from "react";
import { CheckBoxField, SelectField } from "../../../../common-ui/lib";
import { useWorkbookContext } from "../WorkbookProvider";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import {
  THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP,
  useWorkbookConverter
} from "../utils/useWorkbookConverter";
import { getColumnHeaders } from "../utils/workbookMappingUtils";

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

  // Custom styling to indent the group option menus.
  const customStyles = useMemo(
    () => ({
      placeholder: (provided, _) => ({
        ...provided,
        color: "rgb(87,120,94)"
      }),
      menu: (base) => ({ ...base, zIndex: 1050 }),
      control: (base) => ({
        ...base
      }),
      // Grouped options (relationships) should be indented.
      option: (baseStyle, { data }) => {
        if (data?.parentPath) {
          return {
            ...baseStyle,
            paddingLeft: "25px"
          };
        }

        // Default style for everything else.
        return {
          ...baseStyle
        };
      },

      // When viewing a group item, the parent path should be prefixed on to the value.
      singleValue: (baseStyle, { data }) => {
        if (data?.parentPath) {
          return {
            ...baseStyle,
            ":before": {
              content: `'${startCase(data.parentPath)} '`
            }
          };
        }

        return {
          ...baseStyle
        };
      }
    }),
    [selectedType]
  );

  function showMapRelationshipCheckbox(colIndex, fieldPath?: string): boolean {
    if (fieldPath && fieldPath.startsWith("parentMaterialSample.")) {
      return false;
    } else if (
      columnUniqueValues &&
      headers &&
      fieldPath &&
      isFieldInALinkableRelationshipField(fieldPath)
    ) {
      return (
        Object.keys(columnUniqueValues[sheet][headers[colIndex]]).length <=
        THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP
      );
    } else {
      return false;
    }
  }

  const fieldPath = workbookColumnMap[columnName]?.fieldPath;
  return (
    <div className="row">
      <div className="col-md-3 d-flex align-items-center justify-content-start">
        {columnName}
      </div>
      <div className="col-md-3">
        <SelectField
          name={`fieldMap[${columnIndex}].targetField`}
          options={fieldOptions}
          selectProps={{ isClearable: true }}
          hideLabel={true}
          styles={customStyles}
          onChange={(newFieldPath) => {
            setChecked(false);
            onFieldMappingChange(columnName, newFieldPath);
          }}
        />
      </div>
      <div className="col-md-3 d-flex align-items-center">
        <CheckBoxField
          name={`fieldMap[${columnIndex}].skipped`}
          hideLabel={true}
        />
      </div>
      <div className="col-md-3 d-flex align-items-center">
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
