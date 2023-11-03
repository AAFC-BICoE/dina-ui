import { startCase } from "lodash";
import { CheckBoxField, SelectField } from "packages/common-ui/lib";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { useMemo, useState } from "react";
import { FieldMapType } from "./WorkbookColumnMapping";
import { useWorkbookContext } from "./WorkbookProvider";
import FieldMappingConfig from "./utils/FieldMappingConfig";
import { useWorkbookConverter } from "./utils/useWorkbookConverter";
import { getColumnHeaders } from "./utils/workbookMappingUtils";

const THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP = 10;

export interface ColumnMappingRowProps {
  sheet: number;
  selectedType: string;
  columnHeader: string;
  columnIndex: number;
  fieldOptions: (
    | { label: string; value: string }
    | {
        label: string;
        options: [
          { label: string; value: string; parentPath: string },
          ...{ label: string; value: string; parentPath: string }[]
        ];
      }
  )[];
  fieldMap: FieldMapType;
}

export function ColumnMappingRow({
  sheet,
  selectedType,
  columnHeader,
  columnIndex,
  fieldOptions,
  fieldMap
}: ColumnMappingRowProps) {
  const { formatMessage } = useDinaIntl();
  const { spreadsheetData, columnUniqueValues: numberOfUniqueValueByColumn } =
    useWorkbookContext();

  const { flattenedConfig, isFieldInRelationshipField } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType || "material-sample"
  );

  // fieldHeaderPair stores the pairs of field name in the configuration and the column header in the excel file.
  const [fieldHeaderPair, setFieldHeaderPair] = useState(
    {} as { [field: string]: string }
  );

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
    if (
      numberOfUniqueValueByColumn &&
      headers &&
      fieldPath &&
      isFieldInRelationshipField(fieldPath)
    ) {
      return (
        numberOfUniqueValueByColumn[sheet][headers[colIndex]].length <=
        THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP
      );
    } else {
      return false;
    }
  }

  function onFieldMapChanged(e: any) {
    // TODO:
  }

  function onMapRelationshipClicked(colIndex: number, checked: boolean) {
    // TODO:
  }

  return (
    <div className="row">
      <div className="col-md-4">{columnHeader}</div>
      <div className="col-md-4">
        <SelectField
          name={`fieldMap[${columnIndex}]`}
          options={fieldOptions}
          hideLabel={true}
          styles={customStyles}
          onChange={(e) => onFieldMapChanged(e)}
        />
      </div>
      <div className="col-md-4">
        {showMapRelationshipCheckbox(columnIndex, fieldMap[columnIndex]) && (
          <CheckBoxField
            onCheckBoxClick={(e) =>
              onMapRelationshipClicked(columnIndex, e.target.checked)
            }
            name={`mapRelationships[${columnIndex}]`}
            hideLabel={true}
          />
        )}
      </div>
    </div>
  );
}
