import {
  FieldWrapper,
  SelectField,
  SubmitButton,
  useAccount,
  useQuery
} from "common-ui/lib";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray, FormikProps } from "formik";
import { InputResource, KitsuResource } from "kitsu";
import { Ref, useMemo, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import Select from "react-select";
import * as yup from "yup";
import { ValidationError } from "yup";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { WorkbookJSON } from "./types/Workbook";
import FieldMappingConfig from "./utils/FieldMappingConfig";
import {
  DataTypeEnum,
  FieldMappingConfigType,
  useWorkbookConverter
} from "./utils/useWorkbookConverter";
import lodash, { startCase } from "lodash";
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
} from "./utils/workbookMappingUtils";

export type FieldMapType = (string | undefined)[];

export interface WorkbookColumnMappingFields {
  sheet: number;
  type: string;
  fieldMap: FieldMapType;
  group: string;
}

export interface WorkbookColumnMappingProps {
  spreadsheetData: WorkbookJSON;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  onGenerate: (submission: {
    data: InputResource<KitsuResource & { group?: string }>[];
    type?: string;
  }) => void;
}

const ENTITY_TYPES = ["material-sample"] as const;

export function WorkbookColumnMapping({
  spreadsheetData,
  performSave,
  setPerformSave,
  onGenerate
}: WorkbookColumnMappingProps) {
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
  const [fieldMap, setFieldMap] = useState([] as FieldMapType);
  // fieldHeaderPair stores the pairs of field name in the configuration and the column header in the excel file.
  const [fieldHeaderPair, setFieldHeaderPair] = useState(
    {} as { [field: string]: string }
  );
  const { convertWorkbook, flattenedConfig, getPathOfField } =
    useWorkbookConverter(
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
    return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
      const sheetNumber = +sheetNumberString;
      // This label is hardcoded for now, it will eventually be replaced with the sheet name in a
      // future ticket.
      return { label: "Sheet " + (sheetNumber + 1), value: sheetNumber };
    });
  }, [spreadsheetData]);

  // Have to load end-points up front, save all responses in a map
  const FIELD_TO_VOCAB_ELEMS_MAP = new Map();
  Object.keys(FieldMappingConfig).forEach((recordType) => {
    const recordFieldsMap = FieldMappingConfig[recordType];
    Object.keys(recordFieldsMap).forEach((recordField) => {
      const { dataType, endpoint } = recordFieldsMap[recordField];
      switch (dataType) {
        case DataTypeEnum.VOCABULARY:
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
        case DataTypeEnum.MANAGED_ATTRIBUTES:
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
    if (!!selectedType?.value) {
      const nonNestedRowOptions: { label: string; value: string }[] = [];
      const nestedRowOptions: {
        label: string;
        value: string;
        parentPath: string;
      }[] = [];
      const newFieldOptions: { label: string; value: string }[] = [];
      Object.keys(flattenedConfig).forEach((fieldPath) => {
        const config = flattenedConfig[fieldPath];
        if (
          config.dataType !== DataTypeEnum.OBJECT &&
          config.dataType !== DataTypeEnum.OBJECT_ARRAY
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
      const groupedNestRowOptions = lodash
        .chain(nestedRowOptions)
        .groupBy((prop) => prop.parentPath)
        .map((group, key) => {
          return {
            label: key.toUpperCase(),
            options: group
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label))
        .value();
      const map = [] as FieldMapType;
      const _fieldHeaderPair = {};
      for (const columnHeader of headers || []) {
        const field = findMatchField(columnHeader, newFieldOptions)?.value;
        if (field !== undefined) {
          _fieldHeaderPair[field] = columnHeader;
        }
        map.push(field);
      }
      setFieldMap(map);
      setFieldHeaderPair(_fieldHeaderPair);
      return nonNestedRowOptions
        ? [...nonNestedRowOptions, ...groupedNestRowOptions]
        : [];
    } else {
      return [];
    }
  }, [selectedType]);

  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  function onSubmit({ submittedValues }) {
    const workbookData = getDataFromWorkbook(
      spreadsheetData,
      sheet,
      submittedValues.fieldMap
    );
    const samples = convertWorkbook(workbookData, submittedValues.group);
    if (onGenerate) {
      onGenerate({ data: samples, type: selectedType?.value });
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
        for (const field of Object.keys(row)) {
          if (field === "rowNumber") {
            continue;
          }
          const param: {
            sheet: number;
            index: number;
            field: string;
            dataType?: DataTypeEnum;
          } = {
            sheet: sheet + 1,
            index: row.rowNumber + 1,
            field: fieldHeaderPair[field]
          };
          if (!!row[field]) {
            const fieldPath = getPathOfField(field);
            if (fieldPath) {
              switch (flattenedConfig[fieldPath]?.dataType) {
                case DataTypeEnum.BOOLEAN:
                  if (!isBoolean(row[field])) {
                    param.dataType = DataTypeEnum.BOOLEAN;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
                        "sheet"
                      )
                    );
                  }
                  break;
                case DataTypeEnum.NUMBER:
                  if (!isNumber(row[field])) {
                    param.dataType = DataTypeEnum.NUMBER;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
                        "sheet"
                      )
                    );
                  }
                  break;
                case DataTypeEnum.NUMBER_ARRAY:
                  if (!isNumberArray(row[field])) {
                    param.dataType = DataTypeEnum.NUMBER_ARRAY;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
                        "sheet"
                      )
                    );
                  }
                  break;
                case DataTypeEnum.BOOLEAN_ARRAY:
                  if (!isBooleanArray(row[field])) {
                    param.dataType = DataTypeEnum.BOOLEAN_ARRAY;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
                        "sheet"
                      )
                    );
                  }
                  break;
                case DataTypeEnum.MANAGED_ATTRIBUTES:
                  if (!isMap(row[field])) {
                    param.dataType = DataTypeEnum.MANAGED_ATTRIBUTES;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
                        "sheet"
                      )
                    );
                  }
                  const workbookManagedAttributes = convertMap(row[field]);
                  try {
                    isValidManagedAttribute(
                      workbookManagedAttributes,
                      FIELD_TO_VOCAB_ELEMS_MAP.get(field),
                      formatMessage
                    );
                  } catch (error) {
                    errors.push(error);
                  }
                  break;
                case DataTypeEnum.NUMBER:
                  if (!isNumber(row[field])) {
                    param.dataType = DataTypeEnum.NUMBER;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
                        "sheet"
                      )
                    );
                  }
                  break;
                case DataTypeEnum.VOCABULARY:
                  const vocabElements = FIELD_TO_VOCAB_ELEMS_MAP.get(field);
                  if (vocabElements && !vocabElements.includes(row[field])) {
                    param.dataType = DataTypeEnum.VOCABULARY;
                    errors.push(
                      new ValidationError(
                        formatMessage("workBookInvalidDataFormat", param),
                        field,
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
                              styles={customStyles}
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
