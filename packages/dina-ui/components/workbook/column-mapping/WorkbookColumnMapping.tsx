import {
  AreYouSureModal,
  FieldWrapper,
  LoadingSpinner,
  SubmitButton,
  useAccount,
  useModal
} from "common-ui/lib";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray, FormikProps, useFormikContext } from "formik";
import { ManagedAttribute } from "packages/dina-ui/types/collection-api";
import { Ref, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import Select from "react-select";
import * as yup from "yup";
import { ValidationError } from "yup";
import {
  ColumnUniqueValues,
  RelationshipMapping,
  WorkbookColumnMap,
  WorkbookDataTypeEnum,
  useWorkbookContext
} from "..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { WorkbookDisplay } from "../WorkbookDisplay";
import { RelationshipFieldMapping } from "../relationship-mapping/RelationshipFieldMapping";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import {
  FieldOptionType,
  getDataFromWorkbook,
  isBoolean,
  isBooleanArray,
  isNumber,
  isNumberArray
} from "../utils/workbookMappingUtils";
import { ColumnMappingRow } from "./ColumnMappingRow";
import { useColumnMapping } from "./useColumnMapping";

export type FieldMapType = {
  targetField: string | undefined;
  targetKey?: ManagedAttribute; // When targetField is managedAttribute, targetKey stores the key of the managed attribute
  skipped: boolean;
};

export interface WorkbookColumnMappingFields {
  sheet: number;
  type: string;
  fieldMap: FieldMapType[];
  mapRelationships: boolean[];
  group: string;
  relationshipMapping: RelationshipMapping;
}

export interface WorkbookColumnMappingProps {
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

// Entities that we support to import
const ENTITY_TYPES = ["material-sample"] as const;

export function WorkbookColumnMapping({
  performSave,
  setPerformSave
}: WorkbookColumnMappingProps) {
  const { openModal } = useModal();
  const {
    startSavingWorkbook,
    spreadsheetData,
    setColumnMap,
    columnUniqueValues,
    setRelationshipMapping
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

  const {
    convertWorkbook,
    flattenedConfig,
    getFieldRelationshipConfig,
    FIELD_TO_VOCAB_ELEMS_MAP
  } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType?.value || "material-sample"
  );

  const {
    loading,
    fieldMap,
    fieldOptions,
    headers,
    sheetOptions,
    workbookColumnMap,
    relationshipMapping,
    resolveColumnMappingAndRelationshipMapping
  } = useColumnMapping(sheet, selectedType?.value || "material-sample");

  const buttonBar = (
    <>
      <SubmitButton
        className="hidden"
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );
  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  function validateRelationshipMapping() {
    const relationshipColumnNames = Object.keys(columnUniqueValues![sheet])
      .filter(
        (columnName) =>
          workbookColumnMap[columnName]?.mapRelationship &&
          workbookColumnMap[columnName].showOnUI
      )
      .map((columnName) => columnName);
    for (const columnName of relationshipColumnNames) {
      const values = Object.keys(
        (columnUniqueValues ?? {})[sheet]?.[columnName]
      );
      if (!relationshipMapping?.[columnName] && values.length > 0) {
        return false;
      } else {
        const mappedValues = Object.keys(relationshipMapping![columnName]);
        for (const value of values) {
          if (mappedValues.indexOf(value) === -1) {
            return false;
          }
        }
      }
    }
    return true;
  }

  async function onSubmit({ submittedValues }) {
    if (submittedValues.fieldMap.filter((item) => item.skipped).length > 0) {
      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="proceedWithSkippedColumn" />}
          messageBody={
            <DinaMessage id="areYouSureImportWorkbookWithSkippedColumns" />
          }
          onYesButtonClicked={() => {
            importWorkbook(submittedValues);
          }}
        />
      );
    } else if (!validateRelationshipMapping()) {
      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="proceedWithoutMappingAllRecord" />}
          messageBody={
            <DinaMessage id="areYouSureImportWorkbookWithoutMappingAllRecords" />
          }
          onYesButtonClicked={() => {
            importWorkbook(submittedValues);
          }}
        />
      );
    } else {
      importWorkbook(submittedValues);
    }
  }

  async function importWorkbook(submittedValues: any) {
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
        workbookColumnMap,
        submittedValues.relationshipMapping,
        submittedValues.group,
        type,
        baseApiPath
      );
    }
  }

  const workbookColumnMappingFormSchema = yup.object({
    fieldMap: yup.array().test({
      name: "validateFieldMapping",
      exclusive: false,
      test: (fieldMaps: FieldMapType[]) => {
        const errors: ValidationError[] = [];
        for (let i = 0; i < fieldMaps.length; i++) {
          const fieldMapType = fieldMaps[i];
          if (!!fieldMapType && fieldMapType.skipped === false) {
            // validate if there are duplicate mapping
            if (
              fieldMapType.targetField !== undefined &&
              fieldMaps.filter(
                (item) =>
                  item.skipped === false &&
                  item.targetField + (item.targetKey?.name ?? "") ===
                    fieldMapType.targetField +
                      (fieldMapType.targetKey?.name ?? "")
              ).length > 1
            ) {
              errors.push(
                new ValidationError(
                  formatMessage("workBookDuplicateFieldMap"),
                  fieldMapType.targetField,
                  `fieldMap[${i}].targetField`
                )
              );
            }
            // validate if any managed attributes targetKey not set
            if (
              fieldMapType.skipped === false &&
              fieldMapType.targetField !== undefined &&
              flattenedConfig[fieldMapType.targetField].dataType ===
                WorkbookDataTypeEnum.MANAGED_ATTRIBUTES &&
              !fieldMapType.targetKey
            ) {
              errors.push(
                new ValidationError(
                  formatMessage(
                    "workBookManagedAttributeKeysTargetKeyIsRequired"
                  ),
                  fieldMapType.targetField,
                  `fieldMap[${i}].targetKey`
                )
              );
            }
            // validate if any mappings are not set and not skipped
            if (
              fieldMapType.targetField === undefined &&
              fieldMapType.skipped === false
            ) {
              errors.push(
                new ValidationError(
                  formatMessage("workBookSkippedField"),
                  fieldMapType.targetField,
                  `fieldMap[${i}].targetField`
                )
              );
            }
          }
        }
        if (errors.length > 0) {
          return new ValidationError(errors);
        }
        const data = getDataFromWorkbook(
          spreadsheetData,
          sheet,
          fieldMaps,
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
        for (const fieldPath of Object.keys(row)) {
          if (fieldPath === "rowNumber") {
            continue;
          }
          const param: {
            sheet: number;
            index: number;
            field: string;
            dataType?: WorkbookDataTypeEnum;
          } = {
            sheet: sheet + 1,
            index: row.rowNumber + 1,
            field: fieldPath
          };
          if (!!row[fieldPath]) {
            switch (flattenedConfig[fieldPath]?.dataType) {
              case WorkbookDataTypeEnum.BOOLEAN:
                if (!isBoolean(row[fieldPath])) {
                  param.dataType = WorkbookDataTypeEnum.BOOLEAN;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      fieldPath,
                      "sheet"
                    )
                  );
                }
                break;
              case WorkbookDataTypeEnum.NUMBER:
                if (!isNumber(row[fieldPath])) {
                  param.dataType = WorkbookDataTypeEnum.NUMBER;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      fieldPath,
                      "sheet"
                    )
                  );
                }
                break;
              case WorkbookDataTypeEnum.NUMBER_ARRAY:
                if (!isNumberArray(row[fieldPath])) {
                  param.dataType = WorkbookDataTypeEnum.NUMBER_ARRAY;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      fieldPath,
                      "sheet"
                    )
                  );
                }
                break;
              case WorkbookDataTypeEnum.BOOLEAN_ARRAY:
                if (!isBooleanArray(row[fieldPath])) {
                  param.dataType = WorkbookDataTypeEnum.BOOLEAN_ARRAY;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      fieldPath,
                      "sheet"
                    )
                  );
                }
                break;
              case WorkbookDataTypeEnum.NUMBER:
                if (!isNumber(row[fieldPath])) {
                  param.dataType = WorkbookDataTypeEnum.NUMBER;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      fieldPath,
                      "sheet"
                    )
                  );
                }
                break;
              case WorkbookDataTypeEnum.VOCABULARY:
                const vocabElements = FIELD_TO_VOCAB_ELEMS_MAP.get(fieldPath);
                if (vocabElements && !vocabElements.includes(row[fieldPath])) {
                  param.dataType = WorkbookDataTypeEnum.VOCABULARY;
                  errors.push(
                    new ValidationError(
                      formatMessage("workBookInvalidDataFormat", param),
                      fieldPath,
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
    return errors;
  }

  async function onFieldMappingChange(
    columnName: string,
    newFieldPath: string
  ) {
    const { newWorkbookColumnMap, newRelationshipMapping } =
      await resolveColumnMappingAndRelationshipMapping(
        columnName,
        newFieldPath
      );
    setColumnMap(newWorkbookColumnMap);
    setRelationshipMapping(newRelationshipMapping);
  }

  return loading || fieldMap.length === 0 || !relationshipMapping ? (
    <LoadingSpinner loading={loading} />
  ) : (
    <DinaForm<Partial<WorkbookColumnMappingFields>>
      initialValues={{
        sheet: 1,
        type: selectedType?.value || "material-sample",
        fieldMap,
        relationshipMapping,
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
              <Card
                className="mb-3"
                style={{ width: "100%", overflowX: "auto", height: "70hp" }}
              >
                <Card.Body className="mb-3 px-4 py-2">
                  <div className="list-inline d-flex flex-row gap-4 pt-2">
                    <FieldWrapper name="sheet" className="flex-grow-1">
                      <Select
                        value={sheetValue}
                        options={sheetOptions}
                        onChange={(newOption) =>
                          setSheet(newOption?.value ?? 0)
                        }
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </FieldWrapper>
                    <FieldWrapper name="type" className="flex-grow-1">
                      <Select
                        isDisabled={entityTypes.length === 1}
                        value={selectedType}
                        onChange={(entityType) => setSelectedType(entityType)}
                        options={entityTypes}
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </FieldWrapper>
                  </div>
                </Card.Body>
              </Card>

              <WorkbookDisplay
                sheetIndex={sheet}
                workbookJsonData={spreadsheetData}
              />
              <Card
                className="mb-3"
                style={{ width: "100%", overflowX: "auto", height: "70hp" }}
              >
                <Card.Header style={{ fontSize: "1.4em" }}>
                  <DinaMessage id="mapColumns" />
                </Card.Header>
                <Card.Body className="mb-3 px-4 py-2">
                  {/* Column Header Mapping Table */}
                  <div
                    className="row mb-2"
                    style={{ borderBottom: "solid 1px", paddingBottom: "8px" }}
                  >
                    <div className="col-md-4">
                      <DinaMessage id="spreadsheetHeader" />
                    </div>
                    <div className="col-md-6">
                      <DinaMessage id="materialSampleFieldsMapping" />
                    </div>
                    <div className="col-md-2">
                      <DinaMessage id="skipColumn" />
                    </div>
                  </div>
                  {(headers ?? []).map((columnName, index) => (
                    <ColumnMappingRow
                      columnName={columnName}
                      columnIndex={index}
                      fieldOptions={fieldOptions}
                      onFieldMappingChange={onFieldMappingChange}
                      key={index}
                    />
                  ))}
                </Card.Body>
              </Card>

              <RelationshipFieldMapping sheetIndex={sheet} />
            </>
          );
        }}
      </FieldArray>
    </DinaForm>
  );
}
