import {
  AreYouSureModal,
  CheckBoxField,
  FieldWrapper,
  LoadingSpinner,
  SubmitButton,
  useApiClient,
  useModal
} from "common-ui/lib";
import { useLocalStorage } from "@rehooks/local-storage";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { FieldArray, FormikProps } from "formik";
import {
  ManagedAttribute,
  VocabularyElement
} from "packages/dina-ui/types/collection-api";
import { Ref, useMemo, useRef } from "react";
import Link from "next/link";
import { Alert, Card } from "react-bootstrap";
import Select from "react-select";
import * as yup from "yup";
import { ValidationError } from "yup";
import {
  RelationshipMapping,
  WorkbookDataTypeEnum,
  isDate,
  isDateTime,
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
  isNumberArray,
  WorkbookColumnInfo
} from "../utils/workbookMappingUtils";
import { ColumnMappingRow } from "./ColumnMappingRow";
import { useColumnMapping } from "./useColumnMapping";
import { WorkbookWarningDialog } from "../WorkbookWarningDialog";
import _ from "lodash";
import {
  BULK_ADD_FILES_KEY,
  BulkAddFileInfo
} from "../../../pages/object-store/upload";

export type FieldMapType = {
  columnHeader: string;
  originalColumn?: string;
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
const ENTITY_TYPES = ["material-sample", "metadata"] as const;

export function WorkbookColumnMapping({
  performSave,
  setPerformSave
}: WorkbookColumnMappingProps) {
  const { apiClient } = useApiClient();
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
    templateIntegrityWarning,
    sheetOptions,
    workbookColumnMap,
    relationshipMapping,
    resolveColumnMappingAndRelationshipMapping,
    getResourceSelectField
  } = useColumnMapping();

  const { allowAppendData, fieldColumnLocaleId } =
    getFieldRelationshipConfig?.() || {
      allowAppendData: false,
      fieldColumnLocaleId: ""
    };

  const [bulkEditFiles] =
    useLocalStorage<BulkAddFileInfo[]>(BULK_ADD_FILES_KEY);

  const filesToShow = useMemo(
    () => bulkEditFiles?.flatMap((entry) => entry.files) ?? [],
    [bulkEditFiles]
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
  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  function validateRelationshipMapping() {
    const unmappedColumnNames: string[] = [];

    const relationshipColumnNames = Object.keys(
      columnUniqueValues![sheet]
    ).filter(
      (columnName) =>
        workbookColumnMap[columnName]?.mapRelationship &&
        workbookColumnMap[columnName].showOnUI
    );

    for (const columnName of relationshipColumnNames) {
      const values = Object.keys(
        (columnUniqueValues ?? {})[sheet]?.[columnName] || {}
      );

      if (Array.isArray(relationshipMapping[columnName])) {
        if (!relationshipMapping[columnName].length) {
          unmappedColumnNames.push(
            workbookColumnMap[columnName].originalColumnName
          );
        }
      } else if (!relationshipMapping[columnName] && values.length > 0) {
        unmappedColumnNames.push(
          workbookColumnMap[columnName].originalColumnName
        );
      } else {
        const mappedValues = Object.keys(relationshipMapping[columnName] || {});

        for (const value of values) {
          if (mappedValues.indexOf(value.replaceAll(".", "_")) === -1) {
            unmappedColumnNames.push(
              workbookColumnMap[columnName].originalColumnName
            );
            break; // Early exit if a single value is unmapped
          }
        }
      }
    }

    return unmappedColumnNames;
  }

  async function onSubmit({ submittedValues }) {
    const skippedColumns: string[] = submittedValues.fieldMap
      .filter((item) => item.skipped)
      .map((item) => item.columnHeader);
    const unmappedRelationships = validateRelationshipMapping().filter(
      (item) => !skippedColumns.includes(item)
    );

    const showSkipWarning = skippedColumns.length > 0;
    const showMappingWarning = unmappedRelationships.length > 0;

    if (showMappingWarning || showSkipWarning) {
      await openModal(
        <AreYouSureModal
          actionMessage={formatMessage("proceedWithWarning")}
          messageBody={
            <WorkbookWarningDialog
              skippedColumns={skippedColumns}
              unmappedRelationshipsError={unmappedRelationships}
            />
          }
          onYesButtonClicked={() => {
            importWorkbook(submittedValues);
          }}
          yesButtonText={formatMessage("workbookImportAnywayButton")}
          noButtonText={formatMessage("cancelButtonText")}
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
        baseApiPath,
        submittedValues.appendData
      );
    }
  }

  const workbookColumnMappingFormSchema = yup.object({
    fieldMap: yup.array().test({
      name: "validateFieldMapping",
      exclusive: false,
      test: async (fieldMaps: FieldMapType[]) => {
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
              const allFieldOptions = fieldOptions.flatMap((item) => {
                return item.options
                  ? item.options.map((option) => ({
                      label: item.label + " " + option.label,
                      value: option.value
                    }))
                  : [item];
              });
              const fieldNameFormatted = allFieldOptions.find(
                (option) => option.value === fieldMapType.targetField
              );

              errors.push(
                new ValidationError(
                  formatMessage("workBookDuplicateFieldMap", {
                    fieldName: fieldNameFormatted?.label ?? ""
                  }),
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

        await validateData(data, errors);

        if (errors.length > 0) {
          // Scroll to top of the page to display error messages.
          window.scrollTo({ top: 0, behavior: "smooth" });
          return new ValidationError(errors);
        }
        return true;
      }
    })
  });

  /**
   * Instead of displaying "FieldMap.1.TargetField", display the column header to the user.
   *
   * @param field Original error field name.
   * @param error Error message to display.
   * @returns String with the new error message.
   */
  function handleErrorSummary(field: string, error: any): string {
    // Field map should be changed to display a more user-friendly value.
    if (field.startsWith("Field Map")) {
      const indexFound = parseInt(field.split(".")[1], 10) - 1;
      field = fieldMap[indexFound].columnHeader;
    }

    // Any sheet specific errors, just display the error message.
    if (field === "Sheet") {
      return error;
    }

    return field + " - " + error;
  }

  interface UniqueSampleNameCollectionPairs {
    materialSampleName: string;
    collectionName: string;
    collectionUuid: string;
    localDuplicate: boolean;
    serverDuplicate: boolean;
  }

  function validateBulkUploadFiles(
    workbookData: { [field: string]: any }[]
  ): string[] {
    if (!bulkEditFiles || bulkEditFiles.length === 0) {
      return []; // No bulk upload validation needed
    }

    const errors: string[] = [];

    // Check if we have enough rows in the spreadsheet
    if (workbookData.length < bulkEditFiles.length) {
      errors.push(
        formatMessage("workbookInsufficientRows", {
          expected: bulkEditFiles.length,
          actual: workbookData.length
        })
      );
      return errors;
    }

    // Extract original filenames from workbook
    const workbookFilenames = workbookData
      .map((row) => row["originalFilename"] as string)
      .filter(Boolean)
      .map((name) => name.trim().toLowerCase());

    // Check if all uploaded files are present in the workbook
    const expectedFilenames = bulkEditFiles
      .flatMap((entry) => entry.files)
      .map((file) => file.originalFilename.trim().toLowerCase());

    const missingFiles = expectedFilenames.filter(
      (filename) => !workbookFilenames.includes(filename)
    );

    if (missingFiles.length > 0) {
      errors.push(
        formatMessage("workbookMissingFiles", {
          files: missingFiles.slice(0, 5).join(", "),
          remaining: missingFiles.length > 5 ? missingFiles.length - 5 : 0
        })
      );
    }

    // Check for extra files in workbook that weren't uploaded
    const extraFiles = workbookFilenames.filter(
      (filename) => !expectedFilenames.includes(filename)
    );

    if (extraFiles.length > 0) {
      errors.push(
        formatMessage("workbookExtraFiles", {
          files: extraFiles.slice(0, 5).join(", "),
          remaining: extraFiles.length > 5 ? extraFiles.length - 5 : 0
        })
      );
    }

    return errors;
  }

  async function validateData(
    workbookData: { [field: string]: any }[],
    errors: ValidationError[]
  ) {
    if (type === "metadata") {
      const bulkUploadErrors = validateBulkUploadFiles(workbookData);

      if (bulkUploadErrors.length > 0) {
        bulkUploadErrors.forEach((errorMsg) => {
          errors.push(
            new ValidationError(errorMsg, "originalFilename", "sheet")
          );
        });
      }

      for (let i = 0; i < workbookData.length; i++) {
        const row = workbookData[i];
        for (const fieldPath of Object.keys(row)) {
          validateDataFormat(row, fieldPath, errors);
        }
      }

      return errors;
    } else {
      const uniqueSampleCollections: UniqueSampleNameCollectionPairs[] =
        generateUniqueSampleNamePairs();

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
          switch (fieldPath) {
            case "rowNumber":
              continue;
            case "materialSampleName":
              await validateServerDuplicateMaterialSampleNames(
                uniqueSampleCollections
              );
              break;
            case "parentMaterialSample.materialSampleName":
              // If there is a parent material-sample name, but the name is not found
              validateMissingParentMaterialSamples(
                row,
                fieldPath,
                mappedParentNames,
                missingParentMaterialSampleNames
              );
              break;
            default:
              validateDataFormat(row, fieldPath, errors);
          }
        }
      }

      // Report the errors
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

      const onSheetDuplicates: string[] = uniqueSampleCollections
        .filter((pair) => pair.localDuplicate)
        .map(
          (pair) => pair.materialSampleName + " (" + pair.collectionName + ")"
        );
      if (onSheetDuplicates.length > 0) {
        errors.push(
          new ValidationError(
            formatMessage("onSheetDuplicateMaterialSampleNames", {
              duplicateNames: onSheetDuplicates.join(", ")
            }),
            "materialSampleName",
            "sheet"
          )
        );
      }

      const onServerDuplicates: string[] = uniqueSampleCollections
        .filter((pair) => pair.serverDuplicate)
        .map(
          (pair) => pair.materialSampleName + " (" + pair.collectionName + ")"
        );
      if (onServerDuplicates.length > 0) {
        errors.push(
          new ValidationError(
            formatMessage("duplicateMaterialSampleNames", {
              duplicateNames: onServerDuplicates.join(", ")
            }),
            "materialSampleName",
            "sheet"
          )
        );
      }

      return errors;
    }
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

  function generateUniqueSampleNamePairs(): UniqueSampleNameCollectionPairs[] {
    const uniqueSampleCollections: UniqueSampleNameCollectionPairs[] = [];

    const materialSampleNameHeader = "materialSampleName";
    const collectionNameHeader = "collection.name";

    // Check if required spreadsheet headers exist for this validation.
    const materialSampleColumn = fieldMap.find(
      (item) => item.targetField === materialSampleNameHeader
    );
    const collectionNameColumn = fieldMap.find(
      (item) => item.targetField === collectionNameHeader
    );

    // If either column is not found, return empty arrays since we cannot check for duplicates.
    if (!materialSampleColumn || !collectionNameColumn) {
      return [];
    }

    // Retrieve the workbook data.
    const workbookData = getDataFromWorkbook(spreadsheetData, sheet, fieldMap);

    // Map the unique sample name and collection pairs.
    for (const row of workbookData) {
      const materialSampleName = row[materialSampleNameHeader];
      const collectionName = row[collectionNameHeader];
      const existingPair = uniqueSampleCollections.find(
        (pair) =>
          pair.materialSampleName === materialSampleName &&
          pair.collectionName === collectionName
      );
      if (existingPair) {
        existingPair.localDuplicate = true;
      } else {
        const collectionRelationshipHeader =
          collectionNameColumn.columnHeader.replace(" ", "_");
        const collectionUuid = _.get(relationshipMapping, [
          collectionRelationshipHeader,
          collectionName,
          "id"
        ]);
        if (collectionUuid) {
          uniqueSampleCollections.push({
            materialSampleName,
            collectionName,
            collectionUuid,
            localDuplicate: false,
            serverDuplicate: false
          });
        }
      }
    }

    return uniqueSampleCollections;
  }

  async function validateServerDuplicateMaterialSampleNames(
    uniqueSampleCollections: UniqueSampleNameCollectionPairs[]
  ) {
    // If duplicates exist on the sheet, we don't need to check the server.
    if (uniqueSampleCollections.some((pair) => pair.localDuplicate)) {
      return;
    }

    const checkPromises = uniqueSampleCollections.map(async (pair) => {
      // Generate the path for the current pair
      const path = `collection-api/resource-name-identifier?filter[type][EQ]=material-sample&filter[group][EQ]=${encodeURIComponent(
        group ?? ""
      )}&filter[name][EQ]=${encodeURIComponent(pair.materialSampleName)}`;

      try {
        const response = await apiClient.get(path, {
          page: { limit: 1 } // We only need to know if at least one exists
        });

        if (response && response.data && (response.data as any).length > 0) {
          // Expensive request is required since resource-name-identifier does not include the collection name.
          const expensivePath = `collection-api/material-sample?filter[materialSampleName][EQ]=${encodeURIComponent(
            pair.materialSampleName
          )}&filter[collection.id][EQ]=${encodeURIComponent(
            pair.collectionUuid
          )}&filter[group][EQ]=${encodeURIComponent(group ?? "")}`;

          const expensiveRequest = await apiClient.get(expensivePath, {
            page: { limit: 1 } // We only need to know if at least one exists
          });
          if (
            expensiveRequest &&
            expensiveRequest.data &&
            (expensiveRequest.data as any).length > 0
          ) {
            // Found duplicate on the server level.
            pair.serverDuplicate = true;
          }
        }
      } catch (error) {
        console.error(
          `Error checking server duplicate for ${pair.materialSampleName}/${pair.collectionName} at path ${path}:`,
          error
        );
      }
    });

    // Wait for all the API calls and updates to complete
    await Promise.all(checkPromises);
  }

  function validateDataFormat(
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
        case WorkbookDataTypeEnum.ENUM:
          const enumElements = FIELD_TO_VOCAB_ELEMS_MAP.get(fieldPath);
          if (
            enumElements &&
            !enumElements.find((ev) => {
              const rowValue = row[fieldPath]?.toString().toLowerCase();
              const enumValue = ev.value?.toString().toLowerCase();
              const enumLabel = ev.label?.toString().toLowerCase();
              return rowValue === enumValue || rowValue === enumLabel;
            })
          ) {
            param.dataType = WorkbookDataTypeEnum.ENUM;
            errors.push(
              new ValidationError(
                fieldPath +
                  " " +
                  formatMessage("workBookInvalidEnumFormat") +
                  " " +
                  enumElements.map((ev) => ev.label || ev.value).join(", "),
                fieldPath,
                "sheet"
              )
            );
          }
          break;
        case WorkbookDataTypeEnum.STRING_COORDINATE:
          if (!/[a-zA-Z]/.test(row[fieldPath])) {
            param.dataType = WorkbookDataTypeEnum.STRING_COORDINATE;
            errors.push(
              new ValidationError(
                formatMessage("workBookInvalidDataFormat", param),
                fieldPath,
                "sheet"
              )
            );
          }
        case WorkbookDataTypeEnum.DATE:
          if (!isDate(row[fieldPath])) {
            param.dataType = WorkbookDataTypeEnum.DATE;
            errors.push(
              new ValidationError(
                fieldPath + " " + formatMessage("workBookInvalidDateFormat"),
                fieldPath,
                "sheet"
              )
            );
          }
          break;
        case WorkbookDataTypeEnum.DATE_TIME:
          if (!isDateTime(row[fieldPath])) {
            param.dataType = WorkbookDataTypeEnum.DATE_TIME;
            errors.push(
              new ValidationError(
                fieldPath +
                  " " +
                  formatMessage("workBookInvalidDateTimeFormat"),
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
    columnName: WorkbookColumnInfo,
    newFieldPath: string
  ) {
    // Might need to set replace before sending it over. TODO
    const { newWorkbookColumnMap, newRelationshipMapping } =
      await resolveColumnMappingAndRelationshipMapping(
        columnName,
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
    relatedRecord: string | string[],
    targetType: string
  ) {
    const columnHeaderFormatted = columnHeader.replaceAll(".", "_");
    const fieldValueFormatted = fieldValue.replaceAll(".", "_");
    if (relationshipMapping) {
      // Check if the dropdown option selected is undefined (was cleared)
      if (!relatedRecord) {
        // Create a copy of the mapping then delete the relationship since it was unset.
        const updatedMapping = { ...relationshipMapping };
        if (updatedMapping[columnHeaderFormatted]) {
          delete updatedMapping[columnHeaderFormatted][fieldValueFormatted];
          setRelationshipMapping(updatedMapping);
        }
      } else {
        if (Array.isArray(relatedRecord)) {
          const newValue = relatedRecord.map((id) => ({
            id,
            type: targetType
          }));
          setRelationshipMapping({
            ...relationshipMapping,
            [columnHeaderFormatted]: {
              ...relationshipMapping?.[columnHeaderFormatted],
              [fieldValueFormatted]: newValue
            }
          });
        } else {
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
    }
  }

  const selectedType = entityTypes.find((item) => item.value === type);
  return loading || fieldMap.length === 0 ? (
    <LoadingSpinner loading={loading} />
  ) : (
    <DinaForm<Partial<WorkbookColumnMappingFields>>
      key={`${type}-${sheet}`}
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
      customErrorViewerMessage={handleErrorSummary}
      enableReinitialize={true}
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
                    {allowAppendData && <CheckBoxField name="appendData" />}
                  </div>

                  {!templateIntegrityWarning && (
                    <Alert variant="warning" className="mb-1">
                      <Alert.Heading>
                        <DinaMessage id="workbook_templateIntegrityWarning_title" />
                      </Alert.Heading>
                      <p>
                        <DinaMessage id="workbook_templateIntegrityWarning_description" />
                      </p>
                      <hr />
                      <strong className="mb-0">
                        <DinaMessage id="workbook_templateIntegrityWarning_recommended" />
                      </strong>
                      <ul className="mb-0">
                        <li>
                          <strong>
                            <DinaMessage id="workbook_templateIntegrityWarning_recommended_newTemplate_title" />
                          </strong>{" "}
                          <DinaMessage id="workbook_templateIntegrityWarning_recommended_newTemplate_description" />
                        </li>
                        <li>
                          <strong>
                            <DinaMessage id="workbook_templateIntegrityWarning_recommended_verify_title" />
                          </strong>{" "}
                          <DinaMessage id="workbook_templateIntegrityWarning_recommended_verify_description" />
                        </li>
                      </ul>
                    </Alert>
                  )}

                  {type === "metadata" &&
                    (!bulkEditFiles || bulkEditFiles.length === 0) && (
                      <div className="alert alert-danger mb-0">
                        <DinaMessage id="noBulkEditFilesError" />
                        <div className="mt-2">
                          <Link
                            href="/object-store/upload"
                            className="btn btn-primary btn-sm"
                          >
                            <DinaMessage id="goToObjectUploadPage" />
                          </Link>
                        </div>
                      </div>
                    )}

                  {bulkEditFiles &&
                    bulkEditFiles.length > 0 &&
                    type === "metadata" && (
                      <div className="alert alert-info mb-0">
                        <DinaMessage
                          id="bulkUploadDetectedDescription"
                          values={{ count: bulkEditFiles.length }}
                        />
                        <div className="mt-2">
                          <small>
                            <strong>
                              <DinaMessage id="expectedFiles" />:
                            </strong>
                            <ul className="mb-0">
                              {filesToShow.slice(0, 5).map((file) => (
                                <li key={file.id}>{file.originalFilename}</li>
                              ))}
                              {filesToShow.length > 5 && (
                                <li>
                                  <DinaMessage
                                    id="andNMore"
                                    values={{ count: filesToShow.length - 5 }}
                                  />
                                </li>
                              )}
                            </ul>
                          </small>
                        </div>
                      </div>
                    )}
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
                      <DinaMessage id={fieldColumnLocaleId} />
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
                      type={type}
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
