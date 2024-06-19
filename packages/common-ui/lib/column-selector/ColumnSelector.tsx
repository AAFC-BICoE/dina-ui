import { KitsuResource } from "kitsu";
import { ColumnSelectorList } from "./ColumnSelectorList";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import { Dropdown } from "react-bootstrap";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { ESIndexMapping, TableColumn } from "../list-page/types";
import { getColumnSelectorIndexMapColumns } from "./ColumnSelectorUtils";
import { useApiClient } from "../api-client/ApiClientContext";
import useLocalStorage from "@rehooks/local-storage";

export const VISIBLE_INDEX_LOCAL_STORAGE_KEY = "visibleColumns";

export interface ColumnSelectorProps<TData extends KitsuResource> {
  /**
   * A unique identifier to be used for local storage key
   */
  uniqueName?: string;

  /**
   * Display the column selector for exporting purposes instead of what columns to display in a list
   * table.
   */
  exportMode?: boolean;

  /**
   * Should all the options be disabled.
   */
  disabled?: boolean;

  /**
   * Index mapping containing all of the fields that should be displayed in the list.
   */
  indexMapping: ESIndexMapping[] | undefined;

  /**
   * The currently displayed columns on the table.
   */
  displayedColumns: TableColumn<TData>[];

  /**
   * Once the selection is applied, this will be used to set the current columns.
   */
  setDisplayedColumns: React.Dispatch<
    React.SetStateAction<TableColumn<TData>[]>
  >;

  /**
   * The default columns to be loaded in if no columns are found in the local storage.
   */
  defaultColumns: TableColumn<TData>[];

  /**
   * Indicate if all the columns have been loading in...
   */
  setColumnSelectorLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ColumnSelector<TData extends KitsuResource>(
  props: ColumnSelectorProps<TData>
) {
  const { apiClient } = useApiClient();

  const {
    exportMode,
    indexMapping,
    uniqueName,
    defaultColumns,
    setColumnSelectorLoading,
    setDisplayedColumns
  } = props;

  // These are all the possible columns displayed to the user.
  const [columnOptions, setColumnOptions] = useState<TableColumn<TData>[]>([]);

  // Loading state, specifically for dynamically loaded columns.
  const [loading, setLoading] = useState<boolean>(true);

  // Local storage of the displayed columns that are saved.
  const [localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<string[]>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  // This useEffect is responsible for loading in the new local storage displayed columns.
  useEffect(() => {
    if (
      !localStorageDisplayedColumns ||
      localStorageDisplayedColumns?.length === 0
    ) {
      // No local storage to load from, load the default columns in.
      setDisplayedColumns(defaultColumns);

      // Set the default columns into local storage.
      setLocalStorageDisplayedColumns(
        defaultColumns.map((column) => column?.id ?? "")
      );
    } else {
      if (columnOptions.length > 0) {
        const columnsToBeDisplayed = localStorageDisplayedColumns.flatMap<
          TableColumn<TData>
        >((localColumn) => {
          return (
            columnOptions.find((column) => column.id === localColumn) ?? []
          );
        });

        setDisplayedColumns(columnsToBeDisplayed);
      }
    }
  }, [localStorageDisplayedColumns, columnOptions]);

  // Load all the possible options, these are needed incase the user has saved columns to refer to
  // them.
  useEffect(() => {
    function setInternalLoading(value: boolean) {
      setLoading(value);
      setColumnSelectorLoading?.(value);
    }

    if (indexMapping) {
      getColumnSelectorIndexMapColumns<TData>({
        indexMapping,
        setColumnOptions,
        setLoading: setInternalLoading,
        defaultColumns,
        apiClient
      });
    }
  }, [indexMapping]);

  const {
    show: showMenu,
    showDropdown: showDropdownMenu,
    hideDropdown: hideDropdownMenu,
    onKeyDown: onKeyPressDown
  } = menuDisplayControl();

  function menuDisplayControl() {
    const [show, setShow] = useState(false);

    const showDropdown = () => {
      setShow(true);
    };

    const hideDropdown = () => {
      setShow(false);
    };

    function onKeyDown(e) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Space" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        showDropdown();
      } else if (e.key === "Escape" || (e.shiftKey && e.key === "Tab")) {
        hideDropdown();
      }
    }

    function onKeyDownLastItem(e) {
      if (!e.shiftKey && e.key === "Tab") {
        hideDropdown();
      }
    }

    return { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem };
  }

  const menuStyles = useMemo(
    () => ({
      maxHeight: "20rem",
      overflowY: "scroll",
      width: exportMode ? "100%" : "25rem",
      padding: exportMode ? "0" : "1.25rem 1.25rem 1.25rem 1.25rem",
      zIndex: 1
    }),
    [exportMode]
  );

  if (exportMode) {
    return (
      <ColumnSelectorList
        {...props}
        loading={loading}
        columnOptions={columnOptions}
      />
    );
  } else {
    return (
      <Dropdown
        onMouseDown={showDropdownMenu}
        onKeyDown={onKeyPressDown}
        onMouseLeave={hideDropdownMenu}
        show={showMenu}
      >
        <Dropdown.Toggle>
          <DinaMessage id="selectColumn" />
        </Dropdown.Toggle>
        <Dropdown.Menu style={menuStyles as any}>
          <ColumnSelectorList
            {...props}
            loading={loading}
            columnOptions={columnOptions}
          />
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}
