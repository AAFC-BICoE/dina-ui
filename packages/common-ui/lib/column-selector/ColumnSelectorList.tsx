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
import { TableColumn } from "../list-page/types";
import useLocalStorage from "@rehooks/local-storage";

// IDs of columns not supported for exporting
export const NOT_EXPORTABLE_COLUMN_IDS: string[] = [
  "selectColumn",
  "thumbnail",
  "viewPreviewButtonText",
  "organism.determination.verbatimScientificName",
  "organism.determination.scientificName",
  "organism.determination.typeStatus"
];

// IDs of columns that the user cannot configure, they are mandatory.
export const MANDATORY_DISPLAYED_COLUMNS: string[] = [
  "selectColumn",
  "organism.determination.verbatimScientificName",
  "organism.determination.scientificName",
  "organism.determination.typeStatus"
];

export interface ColumnSelectorListProps<TData extends KitsuResource>
  extends ColumnSelectorProps<TData> {
  columnOptions: TableColumn<TData>[];
  loading: boolean;
}

interface NonAppliedOptionChange<TData extends KitsuResource> {
  column: TableColumn<TData>;

  /** True is the column being activated on, false is the column being activated off */
  state: boolean;
}

export function ColumnSelectorList<TData extends KitsuResource>({
  exportMode,
  uniqueName,
  displayedColumns,
  setDisplayedColumns,
  columnOptions,
  loading
}: ColumnSelectorListProps<TData>) {
  const { formatMessage, messages } = useIntl();

  // Search value for filtering the options.
  const [searchValue, setSearchValue] = useState<string>("");

  // State indicating if the select all option has been selected.
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Stores all of the options selected but not applied yet.
  const [nonAppliedOptions, setNonAppliedOptions] = useState<
    NonAppliedOptionChange<TData>[]
  >([]);

  // Local storage of the displayed columns that are saved.
  const [localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<string[]>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  // In exportMode, automatically apply the changes without saving it to local storage.
  useEffect(() => {
    if (exportMode && nonAppliedOptions.length > 0) {
      applyFilterColumns(false);
    }
  }, [exportMode, nonAppliedOptions]);

  /**
   * Search filter function, this is used to search through all the possible columns to display
   * specific ones first.
   *
   * @param item Column definition.
   * @returns true if it should be included in the results, false if not.
   */
  function searchFilter(item: TableColumn<TData>) {
    // If empty search, skip filtering.
    if (searchValue === "") {
      return true;
    }

    // Check if either label or id exists and has a corresponding message
    if (
      (item.label && messages["field_" + item.label]) ||
      (item.id && messages["field_" + item.id])
    ) {
      // Format the message and check for search value (case-insensitive)
      if (
        formatMessage({ id: "field_" + (item.label || item.id) })
          .toLowerCase()
          .indexOf(searchValue.toLowerCase()) !== -1
      ) {
        return true;
      }
    }

    // Search for the relationship type
    if (
      (item.relationshipType ?? "")
        .replace("-", " ")
        .toLowerCase()
        ?.indexOf(searchValue.toLowerCase()) !== -1
    ) {
      return true;
    }

    // Otherwise, just use the ID.
    if (
      (item.id ?? "")
        .replace(".", " ")
        .replace("_", " ")
        .replace("-", " ")
        .toLowerCase()
        ?.indexOf(searchValue.toLowerCase()) !== -1
    ) {
      return true;
    }

    return false;
  }

  /**
   * Based on the `NOT_EXPORTABLE_COLUMN_IDS` list of column ids, filter out columns that should not
   * be shown to the user.
   *
   * @param item Column definition.
   * @returns true if it should be included in the results, false if not.
   */
  function hiddenColumnFilter(item: TableColumn<TData>) {
    if (exportMode) {
      return !NOT_EXPORTABLE_COLUMN_IDS.includes(item.id ?? "");
    } else {
      return !MANDATORY_DISPLAYED_COLUMNS.includes(item.id ?? "");
    }
  }

  function sortCheckboxes(a: TableColumn<TData>, b: TableColumn<TData>) {
    // Check if a column is checked
    const isAChecked = isChecked(a.id, true);
    const isBChecked = isChecked(b.id, true);

    // Checked columns come before unchecked columns
    if (isAChecked && !isBChecked) {
      return -1; // Sort a before b (a comes first)
    } else if (!isAChecked && isBChecked) {
      return 1; // Sort b before a (b comes first)
    } else {
      // If checked, keep the same order as the displayedColumns.
      if (isAChecked && isBChecked) {
        const aIndex = displayedColumns.findIndex((col) => col.id === a.id);
        const bIndex = displayedColumns.findIndex((col) => col.id === b.id);
        return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
      }

      // If both unchecked, sort by their original order (e.g., by ID)
      return (a.id ?? "").localeCompare(b.id ?? "");
    }
  }

  /**
   * This function is used to determine if a checkbox is selected or not. It checks the displayed
   * columns and the nonAppliedOptions to see if it should be checked or not.
   *
   * @param columnId the column ID of the column being checked.
   * @returns true if it shuold be checked, false if not.
   */
  const isChecked = useCallback(
    (columnId: string | undefined, skipNonApplied: boolean) => {
      // First check the nonAppliedOptions if it has been altered.
      if (!skipNonApplied) {
        const nonAppliedFound = nonAppliedOptions.find(
          (item) => item.column.id === columnId
        );
        if (nonAppliedFound !== undefined) {
          return nonAppliedFound.state;
        }
      }

      // Now check if it's currently being displayed on the table, but not applied yet.
      const displayedColumnFound = displayedColumns.find(
        (item) => item.id === columnId
      );
      if (displayedColumnFound !== undefined) {
        return true;
      }

      return false;
    },
    [nonAppliedOptions, displayedColumns]
  );

  /**
   * This function is used to determine the changes made. Since the changes are not applied until
   * the apply button is clicked, the changes are tracked using the nonAppliedOptions.
   *
   * @param columnId The column ID being toggled.
   */
  function toggleColumn(columnId: string | undefined) {
    // Check if the column is already being displayed
    const displayedColumnFound = displayedColumns.find(
      (item) => item.id === columnId
    );

    // Check if the column is being altered.
    const nonAppliedFound = nonAppliedOptions.find(
      (item) => item.column.id === columnId
    );

    // Find the source of the column.
    const sourceColumn = columnOptions.find((item) => item.id === columnId);

    // Was this column already being displayed?
    if (displayedColumnFound) {
      if (nonAppliedFound) {
        // Remove from nonAppliedFound.
        setNonAppliedOptions(
          nonAppliedOptions.filter((item) => item.column.id !== columnId)
        );
      } else if (sourceColumn) {
        // Add the column to the non-applied options since we are removing it as a displayed option.
        setNonAppliedOptions([
          ...nonAppliedOptions.filter((item) => item.column.id !== columnId),
          { column: sourceColumn, state: false }
        ]);
      }
    } else {
      if (nonAppliedFound) {
        // Remove from nonAppliedFound.
        setNonAppliedOptions(
          nonAppliedOptions.filter((item) => item.column.id !== columnId)
        );
      } else if (sourceColumn) {
        // Add the column to the non-applied options since we are adding it as a displayed option.
        setNonAppliedOptions([
          ...nonAppliedOptions.filter((item) => item.column.id !== columnId),
          { column: sourceColumn, state: true }
        ]);
      }
    }
  }

  /**
   * Apply all the available columns to the tracked changes so it can be applied.
   * @param event Used to determine if the checkbox is checked or unchecked.
   */
  function handleToggleAll(event) {
    const checked = event.target.checked;

    // Apply to everything.
    setNonAppliedOptions(
      columnOptions.map<NonAppliedOptionChange<TData>>((item) => ({
        column: item,
        state: checked
      }))
    );

    setSelectAll(checked);
  }

  /**
   * Once the user has selected everything they would like to add/remove, this function will actually
   * apply the changes to the displayed columns.
   */
  function applyFilterColumns(saveToLocalStorage: boolean) {
    // Create a clone of the displayed columns to apply the changes in one go.
    let newDisplayedColumns = displayedColumns;

    for (const nonAppliedOption of nonAppliedOptions) {
      // Check if the non applied option needs to be added (true) or removed (false).
      if (nonAppliedOption.state === true) {
        newDisplayedColumns = [...newDisplayedColumns, nonAppliedOption.column];
      } else {
        // Remove the displayed column.
        newDisplayedColumns = newDisplayedColumns.filter(
          (item) => item.id !== nonAppliedOption.column.id
        );
      }
    }

    // Apply the changes...
    setDisplayedColumns(newDisplayedColumns);

    // Empty the tracked changes...
    setNonAppliedOptions([]);

    if (saveToLocalStorage) {
      // Save to local storage...
      setLocalStorageDisplayedColumns(
        newDisplayedColumns.map((column) => column?.id ?? "")
      );
    }
  }

  const CheckboxItem = React.forwardRef((props: any, ref) => {
    return (
      <Checkbox
        key={props.accessKey}
        id={props.id}
        isChecked={props.isChecked}
        isField={props.isField}
        ref={ref}
        handleClick={props.handleClick}
      />
    );
  });

  return exportMode ? (
    <>
      {loading ? (
        <LoadingSpinner loading={loading} />
      ) : (
        <>
          <strong>{<DinaMessage id="exportColumns" />}</strong>
          <br />

          <Dropdown.Item
            key="__selectall"
            id="selectAll"
            handleClick={handleToggleAll}
            isChecked={selectAll}
            as={CheckboxItem}
          />
          {columnOptions
            .filter(hiddenColumnFilter)
            .filter(searchFilter)
            .sort(sortCheckboxes)
            .map((column, index) => {
              return (
                <Dropdown.Item
                  key={index + "_" + column?.id}
                  id={column?.id}
                  isChecked={isChecked(column?.id, false)}
                  handleClick={() => toggleColumn(column?.id)}
                  isField={true}
                  accessKey={index + "_" + column?.id + "_checkbox"}
                  as={CheckboxItem}
                />
              );
            })}
        </>
      )}
    </>
  ) : (
    <>
      {loading ? (
        <LoadingSpinner loading={loading} />
      ) : (
        <>
          <div>
            <strong>{<FieldHeader name="filterColumns" />}</strong>
            <input
              autoFocus={true}
              name="filterColumns"
              className="form-control"
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
              }}
            />
            <Dropdown.Divider />
          </div>

          <div className="d-flex gap-2 column-selector-apply-button">
            <Button
              disabled={loading || nonAppliedOptions.length === 0}
              className="btn btn-primary mt-1 mb-2 bulk-edit-button w-100"
              onClick={() => applyFilterColumns(true)}
            >
              {formatMessage({ id: "applyButtonText" }) +
                (nonAppliedOptions.length > 0
                  ? " (" + nonAppliedOptions.length + ")"
                  : "")}
            </Button>
          </div>

          <Dropdown.Item
            key="__selectall"
            id="selectAll"
            handleClick={handleToggleAll}
            isChecked={selectAll}
            as={CheckboxItem}
          />
          {columnOptions
            .filter(hiddenColumnFilter)
            .filter(searchFilter)
            .sort(sortCheckboxes)
            .map((column, index) => {
              return (
                <>
                  <Dropdown.Item
                    key={index + "_" + column?.id}
                    id={column?.id}
                    isChecked={isChecked(column?.id, false)}
                    handleClick={() => toggleColumn(column?.id)}
                    isField={true}
                    accessKey={index + "_" + column?.id + "_checkbox"}
                    as={CheckboxItem}
                  />
                </>
              );
            })}
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
