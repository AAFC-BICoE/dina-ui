import { useMemo } from "react";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { WorkbookJSON } from "./types/Workbook";
import { getColumnHeaders } from "./utils/workbookMappingUtils";
import Table from "react-bootstrap/Table";
import { SelectField } from "packages/common-ui/lib";
import { useIndexMapping } from "packages/common-ui/lib/list-page/useIndexMapping";
import { useIntl } from "react-intl";
import startCase from "lodash/startCase";

export interface WorkbookColumnMappingProps {
  spreadsheetData: WorkbookJSON;
}

export function WorkbookColumnMapping({
  spreadsheetData
}: WorkbookColumnMappingProps) {
  const { formatMessage, messages, locale } = useIntl();

  // Retrieve the index map for the selected index. (Currently on the material sample is supported.)
  const { indexMap } = useIndexMapping("dina_material_sample_index");

  // Generate the options that can be selected for the field dropdown.
  const queryRowOptions = useMemo(() => {
    // Get all of the attributes from the index for the filter dropdown.
    const simpleRowOptions = indexMap
      ?.filter((prop) => !prop.parentPath)
      ?.map((prop) => ({
        label: messages["field_" + prop.label]
          ? formatMessage({ id: "field_" + prop.label })
          : startCase(prop.label),
        value: prop.value
      }))
      ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

    return simpleRowOptions ? simpleRowOptions : [];
  }, [indexMap, locale]);

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData);
  }, []);

  return (
    <DinaForm initialValues={{ sheet: 1, type: "material-sample" }}>
      <div className="mb-3 border card px-4 py-2">
        <div className="row mt-2">
          <SelectField
            name={"sheet"}
            options={[{ label: "Sheet 1", value: 1 }]}
            disabled={true}
            className="col-md-6"
          />
          <SelectField
            name={"type"}
            options={[{ label: "Material Sample", value: "material-sample" }]}
            disabled={true}
            className="col-md-6"
          />
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
                  options={queryRowOptions as any}
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
