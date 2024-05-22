import { useApiClient, LoadingSpinner, FieldHeader } from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { startCase } from "lodash";
import { Button } from "react-bootstrap";
import useLocalStorage, { writeStorage } from "@rehooks/local-storage";
import Kitsu, { KitsuResource } from "kitsu";
import { Table, VisibilityState, Column } from "@tanstack/react-table";
import { Checkbox } from "./GroupedCheckboxWithLabel";
import {
  addColumnToStateVariable,
  getColumnSelectorIndexMapColumns,
  getGroupedIndexMappings
} from "./ColumnSelectorUtils";
import {
  DynamicFieldsMappingConfig,
  ESIndexMapping,
  TableColumn
} from "../list-page/types";
import { useIndexMapping } from "../list-page/useIndexMapping";

export const VISIBLE_INDEX_LOCAL_STORAGE_KEY = "visibleIndexColumns";

export interface ColumnSelectorProps<TData extends KitsuResource> {
  /**
   * A unique identifier to be used for local storage key
   */
  uniqueName?: string;

  menuOnly?: boolean;

  /**
   * Index mapping containing all of the fields that should be displayed in the list.
   */
  indexMapping: ESIndexMapping[] | undefined;

  /**
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;

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
}

// Ids of columns not supported for exporting
export const NOT_EXPORTABLE_COLUMN_IDS: string[] = [
  "selectColumn",
  "thumbnail",
  "viewPreviewButtonText"
];

export function ColumnSelector<TData extends KitsuResource>({
  uniqueName,
  menuOnly,
  indexMapping,
  dynamicFieldMapping,
  displayedColumns,
  setDisplayedColumns
}: ColumnSelectorProps<TData>) {
  // Loading state, specifically for dynamically loaded columns.
  const [loading, setLoading] = useState(false);

  // Search value for filtering the options.
  const [searchValue, setSearchValue] = useState("");

  // These are all the possible columns displayed to the user.
  const [columnOptions, setColumnOptions] = useState<TableColumn<TData>[]>([]);

  const [localStorageColumnStates, setLocalStorageColumnStates] =
    useLocalStorage<VisibilityState | undefined>(
      `${uniqueName}_columnSelector`,
      {}
    );

  const {
    show: showMenu,
    showDropdown: showDropdownMenu,
    hideDropdown: hideDropdownMenu,
    onKeyDown: onKeyPressDown
  } = menuDisplayControl();

  const [visibleIndexMapColumns, setVisibleIndexMapColumns] = useLocalStorage<
    any[]
  >(`${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`, []);

  function menuDisplayControl() {
    const [show, setShow] = useState(false);

    const showDropdown = async () => {
      // Check if the dropdown has been loaded yet, if not then load in dynamic fields.
      if (!loading) {
        // This will be where the dynamic fields will be loaded in...
        await getColumnSelectorIndexMapColumns<TData>({
          indexMapping,
          setColumnOptions
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
  // const columnSearchMapping: { label: string; id: string }[] | undefined =
  //   reactTable?.getAllLeafColumns().map((column) => {
  //     const messageKey = `field_${column.id}`;
  //     const label = messages[messageKey]
  //       ? formatMessage({ id: messageKey as any })
  //       : startCase(column.id);
  //     return { label: label.toLowerCase(), id: column.id };
  //   });

  // Keep track of user selected options for when user presses "Apply"
  const filteredColumnsState: VisibilityState = localStorageColumnStates
    ? localStorageColumnStates
    : {};

  function handleToggleAll(event) {
    // const visibilityState = reactTable?.getState()?.columnVisibility;
    // if (visibilityState) {
    //   Object.keys(visibilityState).forEach((columnId) => {
    //     visibilityState[columnId] = event.target.checked;
    //   });
    //   NOT_EXPORTABLE_COLUMN_IDS.forEach((columnId) => {
    //     visibilityState[columnId] = true;
    //   });
    //   setLocalStorageColumnStates(visibilityState);
    // }
    // const reactTableToggleAllHander =
    //   reactTable?.getToggleAllColumnsVisibilityHandler();
    // if (reactTableToggleAllHander) {
    //   reactTableToggleAllHander(event);
    //   NOT_EXPORTABLE_COLUMN_IDS.forEach((columnId) => {
    //     reactTable?.getColumn(columnId)?.toggleVisibility(true);
    //   });
    // }
  }

  function applyFilterColumns() {
    // setSelectedColumnSelectorIndexMapColumns?.([]);
    // if (filteredColumnsState) {
    //   const checkedColumnIds = Object.keys(filteredColumnsState)
    //     .filter((key) => {
    //       return filteredColumnsState[key];
    //     })
    //     .filter((id) => !NOT_EXPORTABLE_COLUMN_IDS.includes(id));
    //   checkedColumnIds.forEach((id) => {
    //     const columnToAddToIndexMapColumns = searchedColumns?.find(
    //       (column) => column.id === id
    //     );
    //     if (columnToAddToIndexMapColumns) {
    //       addColumnToStateVariable(
    //         columnToAddToIndexMapColumns.columnDef,
    //         setSelectedColumnSelectorIndexMapColumns,
    //         columnSelectorDefaultColumns
    //       );
    //     }
    //   });
    //   reactTable?.setColumnVisibility(filteredColumnsState);
    //   setSelectedColumnSelectorIndexMapColumns?.((selectedIndexMapColumns) => {
    //     writeStorage(
    //       `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
    //       selectedIndexMapColumns
    //     );
    //     return selectedIndexMapColumns;
    //   });
    // }
    // setLoadingIndexMapColumns?.((current) => !current);
    // setLocalStorageColumnStates(filteredColumnsState);
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
            width: "25rem",
            padding: "0 1.25rem 1.25rem 1.25rem",

            zIndex: 1
          }}
          className={props.className}
          aria-labelledby={props.labelledBy}
        >
          {menuOnly ? (
            <>
              <strong>{<DinaMessage id="exportColumns" />}</strong>
              <br />
            </>
          ) : (
            <div>
              {" "}
              <strong>{<FieldHeader name="filterColumns" />}</strong>
              <input
                autoFocus={true}
                name="filterColumns"
                className="form-control"
                type="text"
                placeholder="Search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
              <Dropdown.Divider />
            </div>
          )}
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
        isChecked={false}
        as={CheckboxItem}
      />
      {columnOptions?.map((column) => {
        function handleToggle(event) {
          // const reactTableToggleHandler = column?.getToggleVisibilityHandler();
          // reactTableToggleHandler(event);
          // const columnId = column.id;
          // setLocalStorageColumnStates({
          //   ...localStorageColumnStates,
          //   [columnId]: event.target.checked
          // });
          // if (event.target.checked) {
          //   const visibleIndexMapColumn = searchedColumns?.find(
          //     (searchedColumn) => {
          //       if (
          //         !NOT_EXPORTABLE_COLUMN_IDS.includes(column.id) &&
          //         !columnSelectorDefaultColumns?.find(
          //           (defaultColumn) => defaultColumn.id === column.id
          //         ) &&
          //         searchedColumn.id === column.id
          //       ) {
          //         return true;
          //       }
          //       return false;
          //     }
          //   );
          //   if (visibleIndexMapColumn) {
          //     setVisibleIndexMapColumns([
          //       ...visibleIndexMapColumns,
          //       visibleIndexMapColumn?.columnDef
          //     ]);
          //   }
          // } else {
          //   setVisibleIndexMapColumns(
          //     visibleIndexMapColumns.filter(
          //       (visibleColumn) =>
          //         !!visibleColumn && visibleColumn.id !== column.id
          //     )
          //   );
          // }
        }
        return (
          <>
            <Dropdown.Item
              key={column?.id}
              id={column?.id}
              isChecked={false}
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
          isChecked={false}
          as={CheckboxItem}
        />
        {columnOptions?.map((column) => {
          return (
            <>
              <Dropdown.Item
                key={column?.id}
                id={column?.id}
                isChecked={false}
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
