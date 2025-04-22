import useLocalStorage from "@rehooks/local-storage";
import Kitsu, { KitsuResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import {
  ColumnSelectorProps,
  LoadingSpinner,
  useApiClient,
  VISIBLE_INDEX_LOCAL_STORAGE_KEY
} from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { QueryFieldSelector } from "../list-page/query-builder/query-builder-core-components/QueryFieldSelector";
import QueryRowFieldExtensionSearch, {
  FieldExtensionSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";

import QueryRowIdentifierSearch, {
  IdentifierSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import QueryRowManagedAttributeSearch, {
  ManagedAttributeSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import QueryRowRelationshipPresenceSearch, {
  RelationshipPresenceSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import QueryRowColumnFunctionInput, {
  ColumnFunctionSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryRowColumnFunctionInput";
import { ESIndexMapping, TableColumn } from "../list-page/types";
import { ColumnItem } from "./ColumnItem";
import {
  generateColumnDefinition,
  generateColumnPath
} from "./ColumnSelectorUtils";
import QueryRowClassificationSearch, {
  ClassificationSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderClassificationSearch";

export interface ColumnSelectorListProps<TData extends KitsuResource>
  extends ColumnSelectorProps<TData> {
  loading: boolean;
}

export function ColumnSelectorList<TData extends KitsuResource>({
  exportMode,
  uniqueName,
  displayedColumns,
  setDisplayedColumns,
  loading,
  defaultColumns,
  indexMapping,
  dynamicFieldsMappingConfig,
  mandatoryDisplayedColumns,
  nonExportableColumns,
  disabled
}: ColumnSelectorListProps<TData>) {
  const { apiClient } = useApiClient();

  // The selected field from the query field selector.
  const [selectedField, setSelectedField] = useState<ESIndexMapping>();

  // Used for dynamic fields to store the specific dynamic value selected.
  const [dynamicFieldValue, setDynamicFieldValue] = useState<string>();

  // Used for the "Add column" button to determine if it should be disabled or not.
  const [isValidField, setIsValidField] = useState<boolean>(false);

  // Local storage of the displayed columns that are saved.
  const [_localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<string[]>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  const [functionId, setFunctionId] = useState("function1");

  // Handle what happens when the user selects an option from the Query Field Selector. If a dynamic
  // field is selected, verify we are at a point where it can be added.
  useEffect(() => {
    if (selectedField && indexMapping) {
      // Check if it's a dynamic type.
      if (selectedField.dynamicField) {
        if (dynamicFieldValue) {
          switch (selectedField.dynamicField.type) {
            case "managedAttribute":
              const managedAttributeValues: ManagedAttributeSearchStates =
                JSON.parse(dynamicFieldValue);
              if (managedAttributeValues?.selectedManagedAttribute?.id) {
                setIsValidField(true);
                return;
              }
              break;
            case "fieldExtension":
              const fieldExtensionValues: FieldExtensionSearchStates =
                JSON.parse(dynamicFieldValue);
              if (
                fieldExtensionValues.selectedExtension &&
                fieldExtensionValues.selectedField
              ) {
                setIsValidField(true);
                return;
              }
              break;
            case "relationshipPresence":
              const relationshipPresenceValues: RelationshipPresenceSearchStates =
                JSON.parse(dynamicFieldValue);
              if (relationshipPresenceValues.selectedRelationship) {
                setIsValidField(true);
                return;
              }
              break;
            case "identifier":
              const identifierValues: IdentifierSearchStates =
                JSON.parse(dynamicFieldValue);
              if (identifierValues?.selectedIdentifier) {
                setIsValidField(true);
                return;
              }
              break;
            case "columnFunction":
              const parsedValue = JSON.parse(dynamicFieldValue);
              const columnFunctionValues: ColumnFunctionSearchStates =
                Object.values(parsedValue)[0] as any;
              if (
                columnFunctionValues.functionName ===
                  "CONVERT_COORDINATES_DD" ||
                (columnFunctionValues.functionName === "CONCAT" &&
                  (columnFunctionValues.params?.length ?? 0) > 1)
              ) {
                setIsValidField(true);
                return;
              }
              break;
            case "classification":
              const classificationValues: ClassificationSearchStates =
                JSON.parse(dynamicFieldValue);
              if (classificationValues?.selectedClassificationRank) {
                setIsValidField(true);
                return;
              }
              break;
          }
        }
      } else {
        // Regular field selected, not dynamic and requires more options.
        setIsValidField(true);
        return;
      }
    }

    setIsValidField(false);
  }, [selectedField, dynamicFieldValue, indexMapping]);

  // Reset the dynamic field value so it doesn't get mixed with another one.
  useEffect(() => {
    setDynamicFieldValue(undefined);
  }, [selectedField]);

  const onColumnItemDelete = (columnId: string) => {
    const newDisplayedColumns = displayedColumns.filter(
      (column) => column.id !== columnId
    );
    setDisplayedColumns(newDisplayedColumns);

    // Do not save it locally when in export mode, since you can delete columns that are mandatory.
    if (!exportMode) {
      setLocalStorageDisplayedColumns(
        newDisplayedColumns.map((column) => column?.columnSelectorString ?? "")
      );
    }
  };

  const onColumnItemChangeOrder = (
    direction: "up" | "down",
    columnId: string
  ) => {
    // Create a copy of the displayedColumns array
    const newDisplayedColumns = [...displayedColumns];

    // Find the index of the column to be moved
    const columnIndex = newDisplayedColumns.findIndex(
      (column) => column.id === columnId
    );

    // Check if the column exists and the direction is valid
    if (columnIndex !== -1 && (direction === "up" || direction === "down")) {
      // Swap the column with its neighbor based on direction
      const targetIndex =
        direction === "up" ? columnIndex - 1 : columnIndex + 1;

      // Check if the target index is within bounds
      if (targetIndex >= 0 && targetIndex < newDisplayedColumns.length) {
        // Swap elements:
        [newDisplayedColumns[columnIndex], newDisplayedColumns[targetIndex]] = [
          newDisplayedColumns[targetIndex],
          newDisplayedColumns[columnIndex]
        ];
      }
    }

    // Update the displayedColumns state with the modified array
    setDisplayedColumns(newDisplayedColumns);

    // Update local storage if not in export mode
    if (!exportMode) {
      setLocalStorageDisplayedColumns(
        newDisplayedColumns.map((column) => column?.columnSelectorString ?? "")
      );
    }
  };

  const onColumnItemChangeHeader = (headerValue: string, columnId: string) => {
    // This operation should not be possible if not in export mode.
    if (!exportMode) {
      return;
    }

    // Create a copy of the displayedColumns array
    const newDisplayedColumns = [...displayedColumns];

    // Find the index of the column to be moved
    const columnIndex = newDisplayedColumns.findIndex(
      (column) => column.id === columnId
    );

    if (columnIndex !== -1) {
      newDisplayedColumns[columnIndex].exportHeader = headerValue;
    }

    // Update the displayedColumns state with the modified array
    setDisplayedColumns(newDisplayedColumns);
  };

  const onColumnItemInsert = async () => {
    if (isValidField && selectedField && indexMapping) {
      const generatedColumnPath = generateColumnPath({
        indexMapping: selectedField,
        dynamicFieldValue
      });

      const newColumnDefinition = await generateColumnDefinition({
        indexMappings: indexMapping,
        dynamicFieldsMappingConfig,
        path: generatedColumnPath,
        defaultColumns,
        apiClient
      });

      if (newColumnDefinition) {
        // If the column already exists do not add it again.
        if (
          displayedColumns.find(
            (column) =>
              column.columnSelectorString ===
              newColumnDefinition.columnSelectorString
          )
        ) {
          setSelectedField(undefined);
          return;
        }

        // Add new option to the bottom of the list.
        const newDisplayedColumns: TableColumn<TData>[] = [
          ...displayedColumns,
          newColumnDefinition
        ];

        setDisplayedColumns(newDisplayedColumns);
        setSelectedField(undefined);
        // increase function ID
        setFunctionId(
          (funcId) => "function" + (parseInt(funcId.substring(8), 10) + 1)
        );
        // Do not save when in export mode since manage fields that are mandatory to the list view.
        if (!exportMode) {
          setLocalStorageDisplayedColumns(
            newDisplayedColumns.map(
              (column) => column?.columnSelectorString ?? ""
            )
          );
        }
      }
    }
  };

  const onColumnItemSelected = (columnPath: string) => {
    if (indexMapping) {
      const columnIndex = indexMapping.find(
        (index) => index.value === columnPath
      );
      if (columnIndex) {
        setSelectedField(columnIndex);
      }
    }
  };

  // Filter the list to not include columns that cannot be removed/exported.
  const displayedColumnsFiltered = useMemo(() => {
    return displayedColumns.filter((column) => {
      if (exportMode) {
        return !(nonExportableColumns ?? []).some((id) =>
          (column?.id ?? "").startsWith(id)
        );
      }
      return true;
    });
  }, [displayedColumns, exportMode]);

  const indexMappingFiltered = useMemo(() => {
    if (indexMapping) {
      return indexMapping.filter((mapping) => {
        // Check if it's already been used, does not need to shown again since they are already displaying it.
        const alreadyUsed = displayedColumns?.find((column) => {
          // Check if it's a nested field or normal field:
          if (mapping.parentType) {
            return mapping?.value === column?.columnSelectorString;
          } else {
            return mapping?.label === column?.columnSelectorString;
          }
        });
        if (alreadyUsed) {
          return false;
        }

        if (exportMode) {
          return !(nonExportableColumns ?? []).some((id) =>
            mapping?.parentType
              ? (mapping?.value ?? "").startsWith(id)
              : (mapping?.label ?? "").startsWith(id)
          );
        } else {
          return (
            !(mandatoryDisplayedColumns ?? []).some((id) =>
              mapping?.parentType
                ? (mapping?.value ?? "").startsWith(id)
                : (mapping?.label ?? "").startsWith(id)
            ) &&
            !(nonExportableColumns ?? []).some((id) =>
              mapping?.parentType
                ? (mapping?.value ?? "").startsWith(id)
                : (mapping?.label ?? "").startsWith(id)
            )
          );
        }
      });
    }
    return undefined;
  }, [indexMapping, exportMode, displayedColumns]);

  return (
    <>
      {loading || !indexMappingFiltered || !indexMapping ? (
        <LoadingSpinner loading={loading} />
      ) : (
        <>
          <strong>
            <DinaMessage id="columnSelector_addNewColumn" />
          </strong>
          <QueryFieldSelector
            indexMap={indexMappingFiltered}
            currentField={selectedField?.value}
            setField={onColumnItemSelected}
            isInColumnSelector={true}
          />
          {selectedField?.dynamicField?.type === "managedAttribute" && (
            <QueryRowManagedAttributeSearch
              indexMap={indexMapping}
              managedAttributeConfig={selectedField}
              isInColumnSelector={true}
              setValue={setDynamicFieldValue}
              value={dynamicFieldValue}
            />
          )}
          {selectedField?.dynamicField?.type === "fieldExtension" && (
            <QueryRowFieldExtensionSearch
              fieldExtensionConfig={selectedField}
              setValue={setDynamicFieldValue}
              value={dynamicFieldValue}
              isInColumnSelector={true}
            />
          )}
          {selectedField?.dynamicField?.type === "identifier" && (
            <QueryRowIdentifierSearch
              indexMap={indexMapping}
              identifierConfig={selectedField}
              isInColumnSelector={true}
              setValue={setDynamicFieldValue}
              value={dynamicFieldValue}
            />
          )}
          {selectedField?.dynamicField?.type === "relationshipPresence" && (
            <QueryRowRelationshipPresenceSearch
              setValue={setDynamicFieldValue}
              value={dynamicFieldValue}
              indexMapping={indexMapping}
              isInColumnSelector={true}
            />
          )}
          {selectedField?.dynamicField?.type === "columnFunction" && (
            <QueryRowColumnFunctionInput
              functionId={functionId}
              setValue={setDynamicFieldValue}
              value={dynamicFieldValue}
              indexMapping={indexMapping}
              isInColumnSelector={true}
            />
          )}
          {selectedField?.dynamicField?.type === "classification" && (
            <QueryRowClassificationSearch
              setValue={setDynamicFieldValue}
              value={dynamicFieldValue}
              isInColumnSelector={true}
            />
          )}
          <div className="mt-2 d-grid">
            <Button
              className="btn btn-primary"
              disabled={!isValidField}
              onClick={onColumnItemInsert}
            >
              <DinaMessage id="columnSelector_addColumnButton" />
            </Button>
          </div>
          <br />

          {displayedColumnsFiltered.length > 0 && (
            <>
              <strong>
                <DinaMessage
                  id={
                    exportMode
                      ? "columnSelector_columnsToBeExported"
                      : "columnSelector_currentlyDisplayed"
                  }
                />
              </strong>
              {displayedColumnsFiltered.map((column, index) => {
                return (
                  <ColumnItem
                    key={column.id}
                    column={column}
                    isTop={index === 0}
                    isBottom={index === displayedColumnsFiltered.length - 1}
                    isMandatoryField={
                      exportMode
                        ? false
                        : (mandatoryDisplayedColumns ?? []).some((id) =>
                            (column?.id ?? "").startsWith(id)
                          )
                    }
                    isExportMode={exportMode ?? false}
                    isDisabled={disabled ?? false}
                    onColumnItemDelete={onColumnItemDelete}
                    onColumnItemChangeOrder={onColumnItemChangeOrder}
                    onColumnItemChangeHeader={onColumnItemChangeHeader}
                  />
                );
              })}
            </>
          )}
        </>
      )}
    </>
  );
}

export async function downloadDataExport(
  apiClient: Kitsu,
  id: string | undefined,
  name?: string
) {
  if (id) {
    const getFileResponse = await apiClient.get(
      `dina-export-api/file/${id}?type=DATA_EXPORT`,
      {
        responseType: "blob",
        timeout: 0
      }
    );

    // Download the data
    const url = window?.URL.createObjectURL(getFileResponse as any);
    const link = document?.createElement("a");
    link.href = url ?? "";
    link?.setAttribute("download", `${name ?? id}`);
    document?.body?.appendChild(link);
    link?.click();
    window?.URL?.revokeObjectURL(url ?? "");
  }
}
