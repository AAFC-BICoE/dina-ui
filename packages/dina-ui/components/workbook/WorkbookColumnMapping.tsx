import { useMemo, useState, useEffect } from "react";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { WorkbookJSON } from "./types/Workbook";
import { getColumnHeaders } from "./utils/workbookMappingUtils";
import Table from "react-bootstrap/Table";
import { FieldWrapper, SelectField } from "common-ui/lib";
import Select from "react-select";
import { DinaMessage } from "../../intl/dina-ui-intl";
import FieldMappingConfig from "./utils/FieldMappingConfig.json";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { useMateriaSampleConverter } from "./utils/useMaterialSampleConverter";

export interface WorkbookColumnMappingProps {
  spreadsheetData: WorkbookJSON;
}

const ENTITY_TYPES = ["materialSample"] as const;

export function WorkbookColumnMapping({
  spreadsheetData
}: WorkbookColumnMappingProps) {
  const { formatMessage } = useDinaIntl();
  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType),
    value: entityType
  }));
  const [sheet, setSheet] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<{
    label: string;
    value: string;
  } | null>(entityTypes[0]);
  const [fieldOptions, setFieldOptions] = useState(
    [] as { label: string; value: string }[]
  );
  const { convertEntity } = useMateriaSampleConverter(FieldMappingConfig);

  useEffect(() => {
    if (!!selectedType?.value) {
      const filedsConfigs = FieldMappingConfig[selectedType?.value];
      setFieldOptions(
        filedsConfigs.map((item) => ({
          label: formatMessage(`field_${item.field}` as any),
          value: item.field
        }))
      );
    } else {
      setFieldOptions([]);
    }
  }, [selectedType]);

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
  }, [sheet]);

  // Generate sheet dropdown options
  const sheetOptions = useMemo(() => {
    return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
      const sheetNumber = +sheetNumberString;
      // This label is hardcoded for now, it will eventually be replaced with the sheet name in a
      // future ticket.
      return { label: "Sheet " + (sheetNumber + 1), value: sheetNumber };
    });
  }, [spreadsheetData]);

  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  return (
    <DinaForm initialValues={{ sheet: 1, type: "materialSample" }}>
      <div className="mb-3 border card px-4 py-2">
        <div className="list-inline d-flex flex-row gap-4 pt-2">
          <FieldWrapper name="sheet" className="flex-grow-1">
            <Select
              value={sheetValue}
              options={sheetOptions}
              onChange={(newOption) => setSheet(newOption?.value ?? 0)}
            />
          </FieldWrapper>
          <FieldWrapper name="type" className="flex-grow-1">
            <Select
              isDisabled={entityTypes.length === 1}
              value={selectedType}
              onChange={(entityType) => setSelectedType(entityType)}
              options={entityTypes}
            />
          </FieldWrapper>
        </div>
      </div>

      {/* Column Header Mapping Table */}
      <Table>
        <thead>
          <tr>
            <th>
              <DinaMessage id="spreadsheetHeader" />
            </th>
            <th>
              <DinaMessage id="materialSampleFieldsMapping" />
            </th>
          </tr>
        </thead>
        <tbody>
          {headers?.map((columnHeader) => (
            <tr key={columnHeader}>
              <td>{columnHeader}</td>
              <td>
                <SelectField
                  name={"fieldMap[" + columnHeader + "]"}
                  options={fieldOptions}
                  hideLabel={true}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </DinaForm>
  );
}
