import { useMemo } from "react";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { WorkbookJSON } from "./types/Workbook";
import { getColumnHeaders } from "./utils/workbookMappingUtils";
import Table from "react-bootstrap/Table";
import { SelectField } from "packages/common-ui/lib";

export interface WorkbookColumnMappingProps {
  spreadsheetData: WorkbookJSON;
}

export function WorkbookColumnMapping({
  spreadsheetData
}: WorkbookColumnMappingProps) {
  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData);
  }, []);

  return (
    <DinaForm initialValues={{}}>
      <div className="mb-3 border card px-4 py-2">
        <div className="row">
          <SelectField name={"sheet"} options={[]} className="col-md-6" />
          <SelectField name={"type"} options={[]} className="col-md-6" />
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
