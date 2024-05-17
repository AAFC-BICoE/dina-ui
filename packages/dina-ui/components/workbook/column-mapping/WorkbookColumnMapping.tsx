import {
  AreYouSureModal,
  FieldWrapper,
  LoadingSpinner,
  SubmitButton,
  useModal
} from "common-ui/lib";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray, FormikProps } from "formik";
import {
  ManagedAttribute,
  VocabularyElement
} from "packages/dina-ui/types/collection-api";
import { Ref, useRef } from "react";
import { Card } from "react-bootstrap";
import Select from "react-select";
import * as yup from "yup";
import { ValidationError } from "yup";
import {
  RelationshipMapping,
  WorkbookDataTypeEnum,
  useWorkbookContext
} from "..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { WorkbookDisplay } from "../WorkbookDisplay";
import { RelationshipFieldMapping } from "../relationship-mapping/RelationshipFieldMapping";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import {
  getDataFromWorkbook,
  isBoolean,
  isBooleanArray,
  isNumber,
  isNumberArray
} from "../utils/workbookMappingUtils";
import { ColumnMappingRow } from "./ColumnMappingRow";
import { useColumnMapping } from "./useColumnMapping";
import { WorkbookWarningDialog } from "../WorkbookWarningDialog";

export type FieldMapType = {
  columnHeader: string;
  targetField: string | undefined;
  targetKey?: ManagedAttribute | VocabularyElement; // When targetField is managedAttribute, targetKey stores the matching managed attribute
  // When targetField is scientificNameDetails, targetKey stores the matching taxonomicRank
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
    setRelationshipMapping,
    type,
    setType,
    sheet,
    setSheet,
    group,
    setGroup
  } = useWorkbookContext();
  const formRef: Ref<FormikProps<Partial<WorkbookColumnMappingFields>>> =
    useRef(null);
  const { formatMessage } = useDinaIntl();
  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType),
    value: entityType
  }));

  const {
    convertWorkbook,
    flattenedConfig,
    getFieldRelationshipConfig,
    FIELD_TO_VOCAB_ELEMS_MAP
  } = useWorkbookConverter(FieldMappingConfig, type);

  const {
    loading,
    fieldMap,
    fieldOptions,
    headers,
    sheetOptions,
    workbookColumnMap,
    relationshipMapping,
    resolveColumnMappingAndRelationshipMapping,
    getResourceSelectField
  } = useColumnMapping();

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
    const relationshipColumnNames = Object.keys(
      columnUniqueValues![sheet]
    ).filter(
      (columnName) =>
        workbookColumnMap[columnName]?.mapRelationship &&
        workbookColumnMap[columnName].showOnUI
    );
    for (const columnName of relationshipColumnNames) {
      const values = Object.keys(
        (columnUniqueValues ?? {})[sheet]?.[columnName]
      );
      if (!relationshipMapping[columnName] && values.length > 0) {
        return false;
      } else {
        const mappedValues = Object.keys(relationshipMapping[columnName]);
        for (const value of values) {
          if (mappedValues.indexOf(value.replace(".", "_")) === -1) {
            return false;
          }
        }
      }
    }
    return true;
  }

  async function onSubmit({ submittedValues }) {
    let showSkipWarning = false;
    let showMappingWarning = false;
    const skippedColumns = submittedValues.fieldMap.filter(
      (item) => item.skipped
    );

    if (skippedColumns.length > 0) {
      showSkipWarning = true;
    }
    if (!validateRelationshipMapping()) {
      showMappingWarning = true;
    }

    if (showMappingWarning || showSkipWarning) {
      await openModal(
        <AreYouSureModal
          actionMessage={formatMessage("proceedWithWarning")}
          messageBody={
            <WorkbookWarningDialog
              skippedColumns={skippedColumns.map((item) => item.columnHeader)}
              unmappedRelationshipsError={[
                "column1",
                "column2",
                "column3",
                "column4",
                "column5"
              ]}
            />
          }
          onYesButtonClicked={() => {
            importWorkbook(submittedValues);
          }}
          yesButtonText={<>Import anyway</>}
          noButtonText={<>Cancel</>}
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
    const { baseApiPath } = getFieldRelationshipConfig();
    const resources = convertWorkbook(workbookData, submittedValues.group);
    if (resources?.length > 0) {
      await startSavingWorkbook(
        resources,
        workbookColumnMap,
        relationshipMapping as RelationshipMapping,
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
          // Scroll to top of the page to display error messages.
          window.scrollTo({ top: 0, behavior: "smooth" });
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
          // Scroll to top of the page to display error messages.
          window.scrollTo({ top: 0, behavior: "smooth" });
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
    // get all mapped parent material sample names
    const parentValueMapping =
      Object.values(workbookColumnMap ?? {}).find(
        (item) => item.fieldPath === "parentMaterialSample.materialSampleName"
      )?.valueMapping ?? {};
    const mappedParentNames = Object.keys(parentValueMapping);
    const missingParentMaterialSampleNames: string[] = [];

    for (let i = 0; i < workbookData.length; i++) {
      const row = workbookData[i];
      for (const fieldPath of Object.keys(row)) {
        if (fieldPath === "rowNumber") {
          continue;
        }
        if (fieldPath === "parentMaterialSample.materialSampleName") {
          // If there is a parent material-sample name, but the name is not found
          validateMissingParentMaterialSamples(
            row,
            fieldPath,
            mappedParentNames,
            missingParentMaterialSampleNames
          );
        } else {
          valiateDataFormat(row, fieldPath, errors);
        }
      }
    }
    if (missingParentMaterialSampleNames.length > 0) {
      errors.push(
        new ValidationError(
          formatMessage("missingParentMaterialSampleNames", {
            missingNames: missingParentMaterialSampleNames.join(", ")
          }),
          "parentMaterialSample.materialSampleName",
          "sheet"
        )
      );
    }

    return errors;
  }

  function validateMissingParentMaterialSamples(
    row: { [field: string]: any },
    fieldPath: string,
    mappedParentNames: string[],
    missingParentMaterialSampleNames: string[]
  ) {
    if (
      !!row[fieldPath] &&
      row[fieldPath].trim() !== "" &&
      mappedParentNames.indexOf(row[fieldPath]) < 0
    ) {
      missingParentMaterialSampleNames.push(row[fieldPath]);
    }
  }

  function valiateDataFormat(
    row: { [field: string]: any },
    fieldPath: string,
    errors: yup.ValidationError[]
  ) {
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
          if (
            vocabElements &&
            !vocabElements.includes(
              row[fieldPath].toUpperCase().replace(" ", "_")
            )
          ) {
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

  async function onFieldMappingChange(
    columnName: string,
    newFieldPath: string
  ) {
    const { newWorkbookColumnMap, newRelationshipMapping } =
      await resolveColumnMappingAndRelationshipMapping(
        columnName.replace(".", "_"),
        newFieldPath
      );

    setColumnMap(newWorkbookColumnMap);
    setRelationshipMapping(newRelationshipMapping);
  }

  /**
   * When the dropdown value is changed in the relationship mapping section.
   *
   * This will update the relationship mapping to contain the new uuid values.
   *
   * @param columnHeader The spreadsheet column it's being mapped
   * @param fieldValue The value in the spreadsheet that the related record is being mapped
   * @param relatedRecord The UUID of the resource selected in the relationship mapping dropdown
   */
  async function onRelatedRecordChange(
    columnHeader: string,
    fieldValue: string,
    relatedRecord: string,
    targetType: string
  ) {
    const columnHeaderFormatted = columnHeader.replaceAll(".", "_");
    const fieldValueFormatted = fieldValue.replaceAll(".", "_");

    if (relationshipMapping) {
      setRelationshipMapping({
        ...relationshipMapping,
        [columnHeaderFormatted]: {
          ...relationshipMapping?.[columnHeaderFormatted],
          [fieldValueFormatted]: {
            id: relatedRecord,
            type: targetType
          }
        }
      });
    }
  }
  const selectedType = entityTypes.find((item) => item.value === type);
  return loading || fieldMap.length === 0 ? (
    <LoadingSpinner loading={loading} />
  ) : (
    <DinaForm<Partial<WorkbookColumnMappingFields>>
      initialValues={{
        sheet: 1,
        type,
        fieldMap,
        relationshipMapping,
        group
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
                        onChange={(entityType) => setType(entityType!.value)}
                        options={entityTypes}
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </FieldWrapper>
                    <GroupSelectField
                      name="group"
                      enableStoredDefaultGroup={true}
                      hideWithOnlyOneGroup={false}
                      className="flex-grow-1"
                      onChange={(newGroup) => setGroup(newGroup)}
                      selectProps={{
                        menuPortalTarget: document.body,
                        styles: {
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }
                      }}
                    />
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

              <RelationshipFieldMapping
                onChangeRelatedRecord={onRelatedRecordChange}
                getResourceSelectField={getResourceSelectField}
              />
            </>
          );
        }}
      </FieldArray>
    </DinaForm>
  );
}
