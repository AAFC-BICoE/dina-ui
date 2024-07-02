import { KitsuResource } from "kitsu";
import { ColumnSelectorList } from "./ColumnSelectorList";
import { useState, useEffect } from "react";
import React from "react";
import { Dropdown } from "react-bootstrap";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import {
  DynamicFieldsMappingConfig,
  ESIndexMapping,
  TableColumn
} from "../list-page/types";
import { generateColumnDefinition } from "./ColumnSelectorUtils";
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
   * Index mapping containing all of the fields that should be displayed in the list.
   */
  indexMapping: ESIndexMapping[] | undefined;

  /**
   * Dynamic field mapping configuration.
   */
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig;

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
  defaultColumns?: TableColumn<TData>[];

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
    dynamicFieldsMappingConfig,
    uniqueName,
    defaultColumns,
    setColumnSelectorLoading,
    setDisplayedColumns
  } = props;

  // Loading state, specifically for dynamically loaded columns.
  const [loading, setLoading] = useState<boolean>(true);

  const [injectedIndexMapping, setInjectedIndexMapping] =
    useState<ESIndexMapping[]>();

  // Local storage of the displayed columns that are saved.
  const [localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<string[]>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  useEffect(() => {
    if (indexMapping) {
      if (defaultColumns) {
        const injectedMappings = defaultColumns
          .map<ESIndexMapping | undefined>((column) => {
            // Check if this exists within the index mapping already, if not we do not need to inject it inside.
            if (
              indexMapping.find(
                (mapping) =>
                  mapping.label === column.id || mapping.value === column.id
              )
            ) {
              return undefined;
            }

            return {
              label: column.id ?? column.label ?? "",
              path: (column as any)?.accessorKey,
              type: "text",
              value: (column as any)?.accessorKey,
              hideField: false,
              distinctTerm: false,
              keywordMultiFieldSupport: column.isKeyword ?? false,
              keywordNumericSupport: false,
              optimizedPrefix: false,
              containsSupport: false,
              endsWithSupport: false
            };
          })
          .filter((injected) => injected !== undefined);

        setInjectedIndexMapping([
          ...indexMapping,
          ...(injectedMappings as ESIndexMapping[])
        ]);
      } else {
        setInjectedIndexMapping(indexMapping);
      }
    }
  }, [indexMapping, defaultColumns]);

  // This useEffect is responsible for loading in the new local storage displayed columns.
  useEffect(() => {
    function isDefinedColumn(
      column: TableColumn<TData> | undefined
    ): column is TableColumn<TData> {
      return column !== undefined && column.id !== undefined;
    }

    async function loadColumnsFromLocalStorage() {
      if (injectedIndexMapping) {
        const promises = localStorageDisplayedColumns.map(
          async (localColumn) => {
            const newColumnDefinition = await generateColumnDefinition({
              indexMappings: injectedIndexMapping,
              dynamicFieldsMappingConfig,
              apiClient,
              defaultColumns,
              path: localColumn
            });
            return newColumnDefinition;
          }
        );

        const columns = (await Promise.all(promises)).filter(isDefinedColumn);
        setDisplayedColumns(columns);
      }
    }

    if (
      !localStorageDisplayedColumns ||
      localStorageDisplayedColumns?.length === 0
    ) {
      // No local storage to load from, load the default columns in.
      setDisplayedColumns(defaultColumns ?? []);

      // Set the default columns into local storage.
      if (defaultColumns) {
        setLocalStorageDisplayedColumns(
          defaultColumns.map((column) => column?.id ?? "")
        );
      }
    } else {
      loadColumnsFromLocalStorage();
      setLoading(false);
      setColumnSelectorLoading?.(false);
    }
  }, [localStorageDisplayedColumns, injectedIndexMapping]);

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

  if (exportMode) {
    return (
      <ColumnSelectorList
        {...props}
        indexMapping={injectedIndexMapping}
        loading={loading}
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
        <Dropdown.Menu
          style={{
            height: "30rem",
            overflowY: "scroll",
            width: "25rem",
            padding: "1.25rem 1.25rem 1.25rem 1.25rem",
            zIndex: 9000
          }}
        >
          <ColumnSelectorList
            {...props}
            indexMapping={injectedIndexMapping}
            loading={loading}
          />
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}

export const ColumnSelectorMemo = React.memo(ColumnSelector);
