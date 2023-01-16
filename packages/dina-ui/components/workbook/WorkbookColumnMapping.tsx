import { useMemo, useState } from "react";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { WorkbookJSON } from "./types/Workbook";
import { getColumnHeaders } from "./utils/workbookMappingUtils";
import Table from "react-bootstrap/Table";
import { FieldWrapper, SelectField } from "packages/common-ui/lib";
import Select from "react-select";

export interface WorkbookColumnMappingProps {
  spreadsheetData: WorkbookJSON;
}

export function WorkbookColumnMapping({
  spreadsheetData
}: WorkbookColumnMappingProps) {
  const [sheet, setSheet] = useState<number>(0);

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
  }, [sheet]);

  // Generate sheet dropdown options
  const sheetOptions = useMemo(() => {
    return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
      const sheetNumber = +sheetNumberString;
      return { label: "Sheet " + (sheetNumber + 1), value: sheetNumber };
    });
  }, [spreadsheetData]);

  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  return (
    <DinaForm initialValues={{ sheet: 1, type: "material-sample" }}>
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
              value={{ label: "Material Sample", value: "material-sample" }}
              isDisabled={true}
            />
          </FieldWrapper>
        </div>
      </div>

      {/* Column Header Mapping Table */}
      <Table>
        <thead>
          <tr>
            <th>Spreadsheet Header</th>
            <th>Material Sample Field</th>
          </tr>
        </thead>
        <tbody>
          {headers?.map((columnHeader) => (
            <tr key={columnHeader}>
              <td>{columnHeader}</td>
              <td>
                <SelectField
                  name={"fieldMap[" + columnHeader + "]"}
                  options={[]}
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
