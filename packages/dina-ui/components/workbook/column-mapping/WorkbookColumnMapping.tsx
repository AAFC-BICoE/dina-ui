import {
  FieldWrapper,
  SubmitButton,
  useAccount,
  useQuery
} from "common-ui/lib";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray, FormikProps } from "formik";
import { chain, startCase } from "lodash";
import { Ref, useMemo, useRef, useState } from "react";
import Select from "react-select";
import * as yup from "yup";
import { ValidationError } from "yup";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  WorkbookColumnMap,
  WorkbookDataTypeEnum,
  useWorkbookContext
} from "..";
import { ColumnMappingRow } from "./ColumnMappingRow";
import { WorkbookDisplay } from "../WorkbookDisplay";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import {
  convertMap,
  findMatchField,
  getColumnHeaders,
  getDataFromWorkbook,
  isBoolean,
  isBooleanArray,
  isMap,
  isNumber,
  isNumberArray,
  isValidManagedAttribute
} from "../utils/workbookMappingUtils";

export type FieldMapType = (string | undefined)[];

export interface WorkbookColumnMappingFields {
  sheet: number;
  type: string;
  fieldMap: FieldMapType;
  mapRelationships: boolean[];
  group: string;
}

export interface WorkbookColumnMappingProps {
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

const ENTITY_TYPES = ["material-sample"] as const;

export function WorkbookColumnMapping({
  performSave,
  setPerformSave
}: WorkbookColumnMappingProps) {
  const {
    startSavingWorkbook,
    spreadsheetData,
    workbookColumnMap,
    setColumnMap
  } = useWorkbookContext();
  const formRef: Ref<FormikProps<Partial<WorkbookColumnMappingFields>>> =
    useRef(null);
  const { formatMessage } = useDinaIntl();
  const { groupNames } = useAccount();
  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType),
    value: entityType
  }));
  const [sheet, setSheet] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<{
    label: string;
    value: string;
  } | null>(entityTypes[0]);
  // const [fieldMap, setFieldMap] = useState<FieldMapType>([]);
  // // fieldHeaderPair stores the pairs of field name in the configuration and the column header in the excel file.
  // const [fieldHeaderPair, setFieldHeaderPair] = useState(
  //   {} as { [field: string]: string }
  // );

  const {
    convertWorkbook,
    flattenedConfig,
    getPathOfField,
    getFieldRelationshipConfig
  } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType?.value || "material-sample"
  );

  const buttonBar = (
    <>
      <SubmitButton
        className="hidden"
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
  }, [sheet]);

  // Generate sheet dropdown options
  const sheetOptions = useMemo(() => {
    if (spreadsheetData) {
      return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
        const sheetNumber = +sheetNumberString;
        // This label is hardcoded for now, it will eventually be replaced with the sheet name in a
        // future ticket.
        return { label: "Sheet " + (sheetNumber + 1), value: sheetNumber };
      });
    } else {
      return [];
    }
  }, [spreadsheetData]);

  // Have to load end-points up front, save all responses in a map
  const FIELD_TO_VOCAB_ELEMS_MAP = new Map();

  Object.keys(FieldMappingConfig).forEach((recordType) => {
    const recordFieldsMap = FieldMappingConfig[recordType];
    Object.keys(recordFieldsMap).forEach((recordField) => {
      const { dataType, endpoint } = recordFieldsMap[recordField];
      switch (dataType) {
        case WorkbookDataTypeEnum.VOCABULARY:
          if (endpoint) {
            const query: any = useQuery({
              path: endpoint
            });
            const vocabElements =
              query?.response?.data?.vocabularyElements?.map(
                (vocabElement) => vocabElement.name
              );
            FIELD_TO_VOCAB_ELEMS_MAP.set(recordField, vocabElements);
          }
          break;
        case WorkbookDataTypeEnum.MANAGED_ATTRIBUTES:
          if (endpoint) {
            // load available Managed Attributes
            const query: any = useQuery({
              path: endpoint
            });
            FIELD_TO_VOCAB_ELEMS_MAP.set(recordField, query?.response?.data);
          }
          break;
        default:
          break;
      }
    });
  });

  // Generate field options
  const fieldOptions = useMemo(() => {
    if (!!selectedType) {
      const nonNestedRowOptions: { label: string; value: string | null }[] = [];
      const nestedRowOptions: {
        label: string;
        value: string;
        parentPath: string;
      }[] = [];
      const newFieldOptions: { label: string; value: string }[] = [];
      Object.keys(flattenedConfig).forEach((fieldPath) => {
        if (fieldPath === "relationshipConfig") {
          return;
        }
        const config = flattenedConfig[fieldPath];
        if (
          config.dataType !== WorkbookDataTypeEnum.OBJECT &&
          config.dataType !== WorkbookDataTypeEnum.OBJECT_ARRAY
        ) {
          // Handle creating options for all flattened fields to be used for mapping, not actually used for dropdown component
          const newLabelPath = fieldPath.substring(
            fieldPath.lastIndexOf(".") + 1
          );
          const newLabel =
            formatMessage(`field_${newLabelPath}` as any)?.trim() ||
            formatMessage(newLabelPath as any)?.trim() ||
            startCase(newLabelPath);
          const newOption = {
            label: newLabel,
            value: fieldPath
          };
          newFieldOptions.push(newOption);

          // Handle creating options for nested path for dropdown component
          if (fieldPath.includes(".")) {
            const lastIndex = fieldPath.lastIndexOf(".");
            const parentPath = fieldPath.substring(0, lastIndex);
            const labelPath = fieldPath.substring(lastIndex + 1);
            const label =
              formatMessage(`field_${labelPath}` as any)?.trim() ||
              formatMessage(labelPath as any)?.trim() ||
              startCase(labelPath);
            const option = {
              label,
              value: fieldPath,
              parentPath
            };
            nestedRowOptions.push(option);
          } else {
            // Handle creating options for non nested path for dropdown component
            const label =
              formatMessage(`field_${fieldPath}` as any)?.trim() ||
              formatMessage(fieldPath as any)?.trim() ||
              startCase(fieldPath);
            const option = {
              label,
              value: fieldPath
            };
            nonNestedRowOptions.push(option);
          }
        }
      });
      nonNestedRowOptions.sort((a, b) => a.label.localeCompare(b.label));

      // Using the parent name, group the relationships into sections.
      const groupedNestRowOptions = chain(nestedRowOptions)
        .groupBy((prop) => prop.parentPath)
        .map((group, key) => {
          return {
            label: key.toUpperCase(),
            options: group
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label))
        .value();

      // Calculate the workbook column mapping based on the name of the spreadsheet column header name
      const newWorkbookColumnMap: WorkbookColumnMap = {};
      const _fieldHeaderPair = {};
      for (const columnHeader of headers || []) {
        const fieldPath = findMatchField(columnHeader, newFieldOptions)?.value;
        if (fieldPath !== undefined) {
          _fieldHeaderPair[fieldPath] = columnHeader;
          newWorkbookColumnMap[columnHeader] = {
            fieldPath,
            mapRelationship: false
          };
        } else {
          newWorkbookColumnMap[columnHeader] = undefined;
        }
      }
      setColumnMap(newWorkbookColumnMap);
      // End of workbook column mapping calculation

      return nonNestedRowOptions
        ? [...nonNestedRowOptions, ...groupedNestRowOptions]
        : [];
    } else {
      return [];
    }
  }, [selectedType]);

  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  async function onSubmit({ submittedValues }) {
    const workbookData = getDataFromWorkbook(
      spreadsheetData,
      sheet,
      submittedValues.fieldMap
    );
    const { type, baseApiPath } = getFieldRelationshipConfig();
    const resources = convertWorkbook(workbookData, submittedValues.group);
    if (resources?.length > 0) {
      await startSavingWorkbook(
        resources,
        submittedValues.group,
        type,
        baseApiPath
      );
    }
  }

  const workbookColumnMappingFormSchema = yup.object({
    fieldMap: yup.array().test({
      name: "uniqMapping",
      exclusive: false,
      test: (fieldNames: string[]) => {
        const errors: ValidationError[] = [];
        for (let i = 0; i < fieldNames.length; i++) {
          const field = fieldNames[i];
          if (
            !!field &&
            fieldNames.filter((item) => item === field).length > 1
          ) {
            errors.push(
              new ValidationError(
                formatMessage("workBookDuplicateFieldMap"),
                field,
                `fieldMap[${i}]`
              )
            );
          }
        }
        if (errors.length > 0) {
          return new ValidationError(errors);
        }
        const data = getDataFromWorkbook(
          spreadsheetData,
          sheet,
          fieldNames,
          true
        );
        validateData(data, errors);
        if (errors.length > 0) {
          return new ValidationError(errors);
        }
        return true;
      }
    })
  });

  function validateData(
    workbookData: { [field: string]: any }[],
    errors: ValidationError[]
  ) {
    if (!!selectedType?.value) {
      for (let i = 0; i < workbookData.length; i++) {
        const row = workbookData[i];
        for (const columnName of Object.keys(row)) {
          if (columnName === "rowNumber") {
            continue;
          }
          if (!!row[columnName]) {
            const param: {
              sheet: number;
              index: number;
              field: string;
              dataType?: WorkbookDataTypeEnum;
            } = {
              sheet: sheet + 1,
              index: row.rowNumber + 1,
              field: columnName // TODO not sure if this is column name in the spreasheet or fieldPath in the config
            };
            const fieldPath = getPathOfField(columnName);
            if (fieldPath) {
              switch (flattenedConfig[fieldPath]?.dataType) {
                case WorkbookDataTypeEnum.BOOLEAN:
                  if (!isBoolean(row[columnName])) {
                    param.dataType = WorkbookDataTypeEnum.BOOLEAN;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  break;
                case WorkbookDataTypeEnum.NUMBER:
                  if (!isNumber(row[columnName])) {
                    param.dataType = WorkbookDataTypeEnum.NUMBER;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  break;
                case WorkbookDataTypeEnum.NUMBER_ARRAY:
                  if (!isNumberArray(row[columnName])) {
                    param.dataType = WorkbookDataTypeEnum.NUMBER_ARRAY;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  break;
                case WorkbookDataTypeEnum.BOOLEAN_ARRAY:
                  if (!isBooleanArray(row[columnName])) {
                    param.dataType = WorkbookDataTypeEnum.BOOLEAN_ARRAY;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  break;
                case WorkbookDataTypeEnum.MANAGED_ATTRIBUTES:
                  if (!isMap(row[columnName])) {
                    param.dataType = WorkbookDataTypeEnum.MANAGED_ATTRIBUTES;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  const workbookManagedAttributes = convertMap(row[columnName]);
                  try {
                    isValidManagedAttribute(
                      workbookManagedAttributes,
                      FIELD_TO_VOCAB_ELEMS_MAP.get(columnName),
                      formatMessage
                    );
                  } catch (error) {
                    errors.push(error);
                  }
                  break;
                case WorkbookDataTypeEnum.NUMBER:
                  if (!isNumber(row[columnName])) {
                    param.dataType = WorkbookDataTypeEnum.NUMBER;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  break;
                case WorkbookDataTypeEnum.VOCABULARY:
                  const vocabElements =
                    FIELD_TO_VOCAB_ELEMS_MAP.get(columnName);
                  if (
                    vocabElements &&
                    !vocabElements.includes(row[columnName])
                  ) {
                    param.dataType = WorkbookDataTypeEnum.VOCABULARY;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        columnName,
                        "sheet"
                      )
                    );
                  }
                  break;
              }
            }
          }
        }
      }
    }
    return errors;
  }

  function onToggleColumnMapping(colIndex: number, checked: boolean) {
    console.log(`colIndex: ${colIndex}, checked: ${checked}`);
  }

  function onFieldMappingChange(newFieldPath: string) {
    console.log(`newFieldPath: ${newFieldPath}`);
  }

  const fieldMap = Object.values(workbookColumnMap).map((item) =>
    item === undefined ? undefined : item.fieldPath
  );
  return (
    <DinaForm<Partial<WorkbookColumnMappingFields>>
      initialValues={{
        sheet: 1,
        type: selectedType?.value || "material-sample",
        fieldMap,
        group: groupNames && groupNames.length > 0 ? groupNames[0] : undefined
      }}
      innerRef={formRef}
      onSubmit={onSubmit}
      validationSchema={workbookColumnMappingFormSchema}
    >
      {buttonBar}
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

              <WorkbookDisplay
                sheetIndex={sheet}
                workbookJsonData={spreadsheetData}
              />
              <div className="mb-3 border card px-4 py-2">
                {/* Column Header Mapping Table */}
                <div className="row">
                  <div className="col-4">
                    <DinaMessage id="spreadsheetHeader" />
                  </div>
                  <div className="col-4">
                    <DinaMessage id="materialSampleFieldsMapping" />
                  </div>
                  <div className="col-4">
                    <DinaMessage id="mapRelationship" />
                  </div>
                </div>
                {headers
                  ? headers.map((columnName, index) => (
                      <ColumnMappingRow
                        columnHeader={columnName}
                        sheet={sheet}
                        selectedType={selectedType?.value ?? "material-sample"}
                        columnIndex={index}
                        fieldOptions={fieldOptions}
                        fieldMap={fieldMap}
                        key={index}
                        onToggleColumnMapping={onToggleColumnMapping}
                        onFieldMappingChange={onFieldMappingChange}
                      />
                    ))
                  : undefined}
              </div>
              <div className="mb-3 border card px-4 py-2">
                {headers
                  ? headers.map((columnName) => (
                    <>relationship mapping here</>
                      // <RelationshipFieldMapping
                      //   columnName={columnName}
                      //   sheetIndex={sheet}
                      // />
                    ))
                  : undefined}
              </div>
            </>
          );
        }}
      </FieldArray>
    </DinaForm>
  );
}