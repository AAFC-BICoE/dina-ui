import {
  LoadingSpinner,
  FieldHeader,
  VISIBLE_INDEX_LOCAL_STORAGE_KEY,
  ColumnSelectorProps
} from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect, useCallback } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { Button } from "react-bootstrap";
import Kitsu, { KitsuResource } from "kitsu";
import { Checkbox } from "./GroupedCheckboxWithLabel";
import {
  DynamicFieldType,
  ESIndexMapping,
  TableColumn
} from "../list-page/types";
import useLocalStorage from "@rehooks/local-storage";
import { QueryFieldSelector } from "../list-page/query-builder/query-builder-core-components/QueryFieldSelector";
import { ColumnItem } from "./ColumnItem";
import QueryRowManagedAttributeSearch from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import QueryRowFieldExtensionSearch from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";

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
  columnOptions: TableColumn<TData>[];
  loading: boolean;
}

export function ColumnSelectorList<TData extends KitsuResource>({
  exportMode,
  uniqueName,
  displayedColumns,
  setDisplayedColumns,
  columnOptions,
  loading,
  disabled,
  indexMapping
}: ColumnSelectorListProps<TData>) {
  const { formatMessage, messages } = useIntl();

  // The selected field from the query field selector.
  const [selectedField, setSelectedField] = useState<ESIndexMapping>();

  // Used for dynamic fields to store the specific dynamic value selected.
  const [dynamicFieldValue, setDynamicFieldValue] = useState<string>();

  // Local storage of the displayed columns that are saved.
  const [localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<string[]>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  // Handle what happens when the user selects an option from the Query Field Selector. If a dynamic
  // field is selected, more dropdowns have to appear.
  // useEffect(() => {
  //   if (selectedField && indexMapping) {
  //     // Check if it's a dynamic type.
  //     if (!selectedField.dynamicField) {
  //       ...
  //     }
  //   }
  // }, [selectedField, indexMapping]);

  const onColumnItemDelete = (columnId: string) => {
    const newDisplayedColumns = displayedColumns.filter(
      (column) => column.id !== columnId
    );
    setDisplayedColumns(newDisplayedColumns);
    setLocalStorageDisplayedColumns(
      newDisplayedColumns.map((column) => column?.id ?? "")
    );
  };

  const onColumnItemInsert = (columnPath: string) => {
    if (indexMapping) {
      const columnIndex = indexMapping.find(
        (index) => index.value === columnPath
      );
      if (columnIndex) {
        setSelectedField(columnIndex);
      }
    }
  };

  return (
    <>
      {loading || !indexMapping ? (
        <LoadingSpinner loading={loading} />
      ) : (
        <>
          <strong>Add a new column:</strong>
          <QueryFieldSelector
            indexMap={indexMapping}
            currentField={selectedField?.value}
            setField={onColumnItemInsert}
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
          <br />

          <strong>Currently displayed columns:</strong>
          {displayedColumns.length > 0 ? (
            <>
              {displayedColumns.map((column) => {
                return (
                  <ColumnItem
                    key={column.id}
                    column={column}
                    onColumnItemDelete={onColumnItemDelete}
                  />
                );
              })}
            </>
          ) : (
            <>
              <p>Nothing is here... Try adding a column above.</p>
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
