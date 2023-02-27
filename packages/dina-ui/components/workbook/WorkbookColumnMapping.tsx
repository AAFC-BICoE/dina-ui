import {
  FieldWrapper,
  SelectField,
  SubmitButton,
  useAccount,
  useApiClient,
  useQuery
} from "common-ui/lib";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray, FormikProps } from "formik";
import { InputResource, KitsuResource } from "kitsu";
import { FieldExtension } from "packages/dina-ui/types/collection-api/resources/FieldExtension";
import { Ref, useMemo, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import Select from "react-select";
import * as yup from "yup";
import { ValidationError } from "yup";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { WorkbookJSON } from "./types/Workbook";
import FieldMappingConfigJSON from "./utils/FieldMappingConfig.json";
import { DataTypeEnum } from "./utils/useFieldConverters";
import { useWorkbookConverter } from "./utils/useWorkbookConverter";
import {
  findMatchField,
  getColumnHeaders,
  getDataFromWorkbook,
  isBoolean,
  isBooleanArray,
  isMap,
  isNumber,
  isNumberArray
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
const FieldMappingConfig = FieldMappingConfigJSON as {
  [key: string]: {
    [field: string]: { dataType: DataTypeEnum, vocabularyEndpoint?: string };
  };
};

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
  const [fieldHeaderPair, setFieldHeaderPair] = useState(
    {} as { [field: string]: string }
  );
  const { convertWorkbook } = useWorkbookConverter(
    selectedType?.value || "material-sample",
    FieldMappingConfig
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
      const {dataType, vocabularyEndpoint} = recordFieldsMap[recordField];
      if (dataType === DataTypeEnum.VOCABULARY && vocabularyEndpoint) {
        const query: any = useQuery({
          path: vocabularyEndpoint
        });
        const vocabElements = query?.response?.data?.vocabularyElements?.map((vocabElement) => (vocabElement.name));
        FIELD_TO_VOCAB_ELEMS_MAP.set(recordField, vocabElements);
      }
    })
  })

  // Generate field options
  const fieldOptions = useMemo(() => {
    if (!!selectedType?.value) {
      const fieldsConfigs: { [field: string]: { dataType: DataTypeEnum } } =
        FieldMappingConfig[selectedType?.value];
      const newFieldOptions: { label: string; value: string }[] = [];
      Object.keys(fieldsConfigs).forEach((field) => {
        const option = {
          label: formatMessage(`field_${field}` as any),
          value: field
        };
        newFieldOptions.push(option);
      });
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
      return newFieldOptions;
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
        const data = getDataFromWorkbook(spreadsheetData, sheet, fieldNames);
        validateData(data, errors);
        if (errors.length > 0) {
          return new ValidationError(errors);
        }
        return true;
      }
    })
  });

  function validateData(
    workbookData: { [field: string]: string }[],
    errors: ValidationError[]
  ) {
    if (!!selectedType?.value) {
      const fieldsConfigs: {
        [field: string]: { dataType: DataTypeEnum };
      } = FieldMappingConfig[selectedType?.value];
      for (let i = 0; i < workbookData.length; i++) {
        const row = workbookData[i];
        for (const field of Object.keys(row)) {
          const param: {
            sheet: number;
            index: number;
            field: string;
            dataType?: DataTypeEnum;
          } = {
            sheet: sheet + 1,
            index: i + 2,
            field: fieldHeaderPair[field]
          };
          if (!!row[field]) {
            switch (fieldsConfigs[field]?.dataType) {
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
              case DataTypeEnum.MAP:
                if (!isMap(row[field])) {
                  param.dataType = DataTypeEnum.MAP;
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
              case DataTypeEnum.VOCABULARY:
                const vocabElements = FIELD_TO_VOCAB_ELEMS_MAP.get(field);
                if (
                  !vocabElements.includes(
                    row[field]
                  )
                ) {
                  param.dataType = DataTypeEnum.VOCABULARY;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      field,
                      "sheet"
                    )
                  );
                }
            }
          }
        }
      }
    }
    return errors;
  }

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
