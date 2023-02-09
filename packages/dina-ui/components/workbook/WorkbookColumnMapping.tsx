import { FieldWrapper, SelectField, SubmitButton } from "common-ui/lib";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray } from "formik";
import { useMemo, useState } from "react";
import Table from "react-bootstrap/Table";
import Select from "react-select";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { WorkbookJSON } from "./types/Workbook";
import FieldMappingConfig from "./utils/FieldMappingConfig.json";
import { useMateriaSampleConverter } from "./utils/useMaterialSampleConverter";
import {
  getColumnHeaders,
  getSelectedValue
} from "./utils/workbookMappingUtils";

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
  const [fieldMap, setFieldMap] = useState(
    [] as ({ label: string; value: string } | undefined)[]
  );
  const { convertEntity } = useMateriaSampleConverter(FieldMappingConfig);

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

  // Generate field options
  const fieldOptions = useMemo(() => {
    if (!!selectedType?.value) {
      const filedsConfigs = FieldMappingConfig[selectedType?.value];
      const newFieldOptions = filedsConfigs.map((item) => ({
        label: formatMessage(`field_${item.field}` as any),
        value: item.field
      }));
      const map = [] as any[];
      for (const columnHeader of headers || []) {
        map.push(getSelectedValue(columnHeader, newFieldOptions)?.value);
      }
      setFieldMap(map);
      return newFieldOptions;
    } else {
      return [];
    }
  }, [selectedType]);

  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  const onSubmitInternal = (_submittedValues) => {
    // console.log(submittedValues);
  };

  return (
    <DinaForm
      initialValues={{
        sheet: 1,
        type: "materialSample",
        fieldMap
      }}
      onSubmit={onSubmitInternal}
    >
      <FieldArray name="fieldMap">
        {() => {
          return (
            <>
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
                  {headers
                    ? headers.map((columnHeader, index) => (
                        <tr key={columnHeader}>
                          <td>{columnHeader}</td>
                          <td>
                            <SelectField
                              name={`fieldMap[${index}]`}
                              options={fieldOptions}
                              hideLabel={true}
                            />
                          </td>
                        </tr>
                      ))
                    : undefined}
                </tbody>
              </Table>
            </>
          );
        }}
      </FieldArray>
    </DinaForm>
  );
}
