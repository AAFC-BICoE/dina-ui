import {
  TextField,
  DATA_EXPORT_QUERY_KEY,
  useApiClient,
  LoadingSpinner,
  LabelView,
  FieldHeader
} from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect, useCallback } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { compact, startCase } from "lodash";
import { Button } from "react-bootstrap";
import useLocalStorage, { writeStorage } from "@rehooks/local-storage";
import { DataExport } from "packages/dina-ui/types/dina-export-api";
import Kitsu from "kitsu";
import { Table, VisibilityState, Column } from "@tanstack/react-table";
import { Checkbox } from "./GroupedCheckboxWithLabel";
import {
  addColumnToStateVariable,
  getColumnSelectorIndexMapColumns,
  getGroupedIndexMappings
} from "./ColumnSelectorUtils";
import { DynamicFieldsMappingConfig } from "../list-page/types";
import { useIndexMapping } from "../list-page/useIndexMapping";

export const VISIBLE_INDEX_LOCAL_STORAGE_KEY = "visibleIndexColumns";
export interface ColumnSelectorProps<TData> {
  /** A unique identifier to be used for local storage key */
  uniqueName?: string;
  reactTable: Table<TData> | undefined;
  menuOnly?: boolean;
  /**
   * Used for the listing page to understand which columns can be provided. Filters are generated
   * based on the index provided.
   *
   * Also used to store saved searches under a specific type:
   *
   * `UserPreference.savedSearches.[INDEX_NAME].[SAVED_SEARCH_NAME]`
   *
   * For example, to get the default saved searches for the material sample index:
   * `UserPreference.savedSearches.dina_material_sample_index.default.filters`
   */
  indexName?: string;

  /**
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;

  // State setter to pass the processed index map columns to parent components
  setColumnSelectorIndexMapColumns?: React.Dispatch<
    React.SetStateAction<any[]>
  >;

  // State setter to pass the processed index map columns to parent components
  setSelectedColumnSelectorIndexMapColumns?: React.Dispatch<
    React.SetStateAction<any[]>
  >;

  // If true, index map columns are being loaded and processed from back end
  setLoadingIndexMapColumns?: React.Dispatch<React.SetStateAction<boolean>>;

  // The default visible columns
  columnSelectorDefaultColumns?: any[];
}

// Ids of columns not supported for exporting
export const NOT_EXPORTABLE_COLUMN_IDS: string[] = [
  "selectColumn",
  "thumbnail",
  "viewPreviewButtonText"
];

export function ColumnSelector<TData>({
  uniqueName,
  reactTable,
  menuOnly,
  indexName,
  dynamicFieldMapping,
  setColumnSelectorIndexMapColumns,
  setLoadingIndexMapColumns,
  columnSelectorDefaultColumns,
  setSelectedColumnSelectorIndexMapColumns
}: ColumnSelectorProps<TData>) {
  const [localStorageColumnStates, setLocalStorageColumnStates] =
    useLocalStorage<VisibilityState | undefined>(
      `${uniqueName}_columnSelector`,
      {}
    );
  const [loadedIndexMapColumns, setLoadedIndexMapColumns] =
    useState<boolean>(false);
  const {
    show: showMenu,
    showDropdown: showDropdownMenu,
    hideDropdown: hideDropdownMenu,
    onKeyDown: onKeyPressDown
  } = menuDisplayControl();
  const { apiClient, save } = useApiClient();
  let groupedIndexMappings;
  let indexMap;
  if (indexName) {
    const indexObject = useIndexMapping({
      indexName,
      dynamicFieldMapping
    });
    indexMap = indexObject.indexMap;
    groupedIndexMappings = getGroupedIndexMappings(indexName, indexMap);
  }

  const [visibleIndexMapColumns, setVisibleIndexMapColumns] = useLocalStorage<
    any[]
  >(`${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`, []);

  function menuDisplayControl() {
    const [show, setShow] = useState(false);

    const showDropdown = async () => {
      if (!loadedIndexMapColumns) {
        setLoading(true);
        await getColumnSelectorIndexMapColumns({
          groupedIndexMappings,
          setLoadedIndexMapColumns,
          setColumnSelectorIndexMapColumns,
          apiClient
        });
        setLoading(false);
      }
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

  const { formatMessage, messages } = useIntl();
  // For finding columns using text search
  const columnSearchMapping: { label: string; id: string }[] | undefined =
    reactTable?.getAllLeafColumns().map((column) => {
      const messageKey = `field_${column.id}`;
      const label = messages[messageKey]
        ? formatMessage({ id: messageKey as any })
        : startCase(column.id);
      return { label: label.toLowerCase(), id: column.id };
    });

  // Keep track of user selected options for when user presses "Apply"
  const filteredColumnsState: VisibilityState = localStorageColumnStates
    ? localStorageColumnStates
    : {};
  // Columns filtered from text search
  const [searchedColumns, setSearchedColumns] =
    useState<Column<TData, unknown>[]>();

  // Set initial columns for column selector dropdown and local storage
  useEffect(() => {
    if (localStorageColumnStates) {
      reactTable?.setColumnVisibility(localStorageColumnStates);
    }
    setSearchedColumns(reactTable?.getAllLeafColumns());
  }, [reactTable, reactTable?.getAllColumns().length]);

  const [loading, setLoading] = useState(false);

  // Keep track of column text search value
  const [filterColumsValue, setFilterColumnsValue] = useState<string>("");

  function handleToggleAll(event) {
    const visibilityState = reactTable?.getState()?.columnVisibility;
    if (visibilityState) {
      Object.keys(visibilityState).forEach((columnId) => {
        visibilityState[columnId] = event.target.checked;
      });
      NOT_EXPORTABLE_COLUMN_IDS.forEach((columnId) => {
        visibilityState[columnId] = true;
      });
      setLocalStorageColumnStates(visibilityState);
    }
    const reactTableToggleAllHander =
      reactTable?.getToggleAllColumnsVisibilityHandler();
    if (reactTableToggleAllHander) {
      reactTableToggleAllHander(event);
      NOT_EXPORTABLE_COLUMN_IDS.forEach((columnId) => {
        reactTable?.getColumn(columnId)?.toggleVisibility(true);
      });
    }
  }

  function applyFilterColumns() {
    setSelectedColumnSelectorIndexMapColumns?.([]);
    if (filteredColumnsState) {
      const checkedColumnIds = Object.keys(filteredColumnsState)
        .filter((key) => {
          return filteredColumnsState[key];
        })
        .filter((id) => !NOT_EXPORTABLE_COLUMN_IDS.includes(id));
      checkedColumnIds.forEach((id) => {
        const columnToAddToIndexMapColumns = searchedColumns?.find(
          (column) => column.id === id
        );
        if (columnToAddToIndexMapColumns) {
          addColumnToStateVariable(
            columnToAddToIndexMapColumns.columnDef,
            setSelectedColumnSelectorIndexMapColumns,
            columnSelectorDefaultColumns
          );
        }
      });

      reactTable?.setColumnVisibility(filteredColumnsState);
      setSelectedColumnSelectorIndexMapColumns?.((selectedIndexMapColumns) => {
        writeStorage(
          `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
          selectedIndexMapColumns
        );
        return selectedIndexMapColumns;
      });
    }
    setLoadingIndexMapColumns?.((current) => !current);
    setLocalStorageColumnStates(filteredColumnsState);
  }

  const CheckboxItem = React.forwardRef((props: any, ref) => {
    return (
      <Checkbox
        key={props.id}
        id={props.id}
        isChecked={props.isChecked}
        isField={props.isField}
        filteredColumnsState={filteredColumnsState}
        ref={ref}
        handleClick={props.handleClick}
      />
    );
  });

  const ColumnSelectorMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      if (props.style) {
        props.style.transform = "translate(0px, 40px)";
      }
      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "20px",
            zIndex: 1
          }}
          className={props.className}
          aria-labelledby={props.labelledBy}
        >
          <strong>{<FieldHeader name="filterColumns" />}</strong>
          <input
            autoFocus={true}
            name="filterColumns"
            className="form-control"
            type="text"
            placeholder="Search"
            value={filterColumsValue}
            onChange={(event) => {
              const value = event.target.value;
              setFilterColumnsValue(value);
              if (value === "" || !value) {
                setSearchedColumns(reactTable?.getAllLeafColumns());
              } else {
                const searchedColumnsIds = columnSearchMapping
                  ?.filter((columnMapping) =>
                    columnMapping.label.includes(value?.toLowerCase())
                  )
                  .map((filteredMapping) => filteredMapping.id);
                const filteredColumns = reactTable
                  ?.getAllLeafColumns()
                  .filter((column) => searchedColumnsIds?.includes(column.id));
                setSearchedColumns(filteredColumns);
              }
            }}
          />
          <Dropdown.Divider />
          {
            <div className="d-flex gap-2">
              {!menuOnly && (
                <Button
                  disabled={loading}
                  className="btn btn-primary mt-1 mb-2 bulk-edit-button"
                  onClick={applyFilterColumns}
                >
                  {loading ? (
                    <LoadingSpinner loading={loading} />
                  ) : (
                    formatMessage({ id: "applyButtonText" })
                  )}
                </Button>
              )}
            </div>
          }
          {props.children}
        </div>
      );
    }
  );

  return loading ? (
    <LoadingSpinner loading={loading} />
  ) : menuOnly ? (
    <ColumnSelectorMenu>
      <Dropdown.Item
        id="selectAll"
        handleClick={handleToggleAll}
        isChecked={reactTable?.getIsAllColumnsVisible()}
        as={CheckboxItem}
      />
      {searchedColumns?.map((column) => {
        function handleToggle(event) {
          const reactTableToggleHandler = column?.getToggleVisibilityHandler();
          reactTableToggleHandler(event);
          const columnId = column.id;
          setLocalStorageColumnStates({
            ...localStorageColumnStates,
            [columnId]: event.target.checked
          });
          if (event.target.checked) {
            const visibleIndexMapColumn = searchedColumns?.find(
              (searchedColumn) => {
                if (
                  !NOT_EXPORTABLE_COLUMN_IDS.includes(column.id) &&
                  !columnSelectorDefaultColumns?.find(
                    (defaultColumn) => defaultColumn.id === column.id
                  ) &&
                  searchedColumn.id === column.id
                ) {
                  return true;
                }
                return false;
              }
            );
            if (visibleIndexMapColumn) {
              setVisibleIndexMapColumns([
                ...visibleIndexMapColumns,
                visibleIndexMapColumn?.columnDef
              ]);
            }
          } else {
            setVisibleIndexMapColumns(
              visibleIndexMapColumns.filter(
                (visibleColumn) =>
                  !!visibleColumn && visibleColumn.id !== column.id
              )
            );
          }
        }
        return (
          <>
            <Dropdown.Item
              key={column?.id}
              id={column?.id}
              isChecked={column?.getIsVisible()}
              isField={true}
              handleClick={handleToggle}
              as={CheckboxItem}
            />
          </>
        );
      })}
    </ColumnSelectorMenu>
  ) : (
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
        as={ColumnSelectorMenu}
        style={{ maxHeight: "20rem", overflowY: "scroll" }}
      >
        <Dropdown.Item
          id="selectAll"
          handleClick={handleToggleAll}
          isChecked={reactTable?.getIsAllColumnsVisible()}
          as={CheckboxItem}
        />
        {searchedColumns?.map((column) => {
          return (
            <>
              <Dropdown.Item
                key={column?.id}
                id={column?.id}
                isChecked={column?.getIsVisible()}
                isField={true}
                as={CheckboxItem}
              />
            </>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
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
