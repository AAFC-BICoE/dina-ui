import {
  LoadingSpinner,
  VISIBLE_INDEX_LOCAL_STORAGE_KEY,
  ColumnSelectorProps,
  useApiClient
} from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "react-bootstrap";
import Kitsu, { KitsuResource } from "kitsu";
import { ESIndexMapping, TableColumn } from "../list-page/types";
import useLocalStorage from "@rehooks/local-storage";
import { QueryFieldSelector } from "../list-page/query-builder/query-builder-core-components/QueryFieldSelector";
import { ColumnItem } from "./ColumnItem";
import QueryRowManagedAttributeSearch, {
  ManagedAttributeSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import QueryRowFieldExtensionSearch, {
  FieldExtensionSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import {
  generateColumnDefinition,
  generateColumnPath
} from "./ColumnSelectorUtils";

// IDs of columns not supported for exporting
export const NOT_EXPORTABLE_COLUMN_IDS: string[] = [
  "selectColumn",
  "thumbnail",
  "viewPreviewButtonText",
  "assemblages.",
  "projects.",
  "organism."
];

// IDs of columns that the user cannot configure, they are mandatory.
export const MANDATORY_DISPLAYED_COLUMNS: string[] = [
  "selectColumn",
  "thumbnail",
  "originalFilename",
  "materialSampleName",
  "assemblages.",
  "projects.",
  "organism."
];

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
  dynamicFieldsMappingConfig
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
    if (selectedField) {
      setDynamicFieldValue(undefined);
    }
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

  const onColumnItemInsert = async () => {
    if (isValidField && selectedField && indexMapping) {
      const newColumnDefinition = await generateColumnDefinition({
        indexMappings: indexMapping,
        dynamicFieldsMappingConfig,
        path: generateColumnPath({
          indexMapping: selectedField,
          dynamicFieldValue
        }),
        defaultColumns,
        apiClient
      });

      if (newColumnDefinition) {
        // Add new option to the bottom of the list.
        const newDisplayedColumns: TableColumn<TData>[] = [
          ...displayedColumns,
          newColumnDefinition
        ];

        setDisplayedColumns(newDisplayedColumns);

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
        return !NOT_EXPORTABLE_COLUMN_IDS.some((id) =>
          (column?.id ?? "").startsWith(id)
        );
      }
      return true;
    });
  }, [displayedColumns, exportMode]);

  const indexMappingFiltered = useMemo(() => {
    if (indexMapping) {
      return indexMapping.filter((mapping) => {
        if (exportMode) {
          return !NOT_EXPORTABLE_COLUMN_IDS.some(
            (id) =>
              (mapping?.value ?? "").startsWith(id) ||
              (mapping?.label ?? "").startsWith(id)
          );
        } else {
          return !MANDATORY_DISPLAYED_COLUMNS.some(
            (id) =>
              (mapping?.value ?? "").startsWith(id) ||
              (mapping?.label ?? "").startsWith(id)
          );
        }
      });
    }
    return undefined;
  }, [indexMapping, exportMode]);

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
              {displayedColumnsFiltered.map((column) => {
                return (
                  <ColumnItem
                    key={column.id}
                    column={column}
                    isMandatoryField={
                      exportMode
                        ? false
                        : MANDATORY_DISPLAYED_COLUMNS.some((id) =>
                            (column?.id ?? "").startsWith(id)
                          )
                    }
                    onColumnItemDelete={onColumnItemDelete}
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
        responseType: "blob"
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
