import { useApiClient, LoadingSpinner, FieldHeader } from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { Button } from "react-bootstrap";
import useLocalStorage, { writeStorage } from "@rehooks/local-storage";
import Kitsu, { KitsuResource } from "kitsu";
import { Checkbox } from "./GroupedCheckboxWithLabel";
import { getColumnSelectorIndexMapColumns } from "./ColumnSelectorUtils";
import { ESIndexMapping, TableColumn } from "../list-page/types";

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
}

// Ids of columns not supported for exporting
export const NOT_EXPORTABLE_COLUMN_IDS: string[] = [
  "selectColumn",
  "thumbnail",
  "viewPreviewButtonText"
];

interface NonAppliedOptionChange<TData extends KitsuResource> {
  column: TableColumn<TData>;

  /** True is the column being activated on, false is the column being activated off */
  state: boolean;
}

export function ColumnSelector<TData extends KitsuResource>({
  uniqueName,
  menuOnly,
  indexMapping,
  displayedColumns,
  setDisplayedColumns,
  defaultColumns
}: ColumnSelectorProps<TData>) {
  const { apiClient } = useApiClient();
  const { formatMessage, messages } = useIntl();

  // Loading state, specifically for dynamically loaded columns.
  const [loading, setLoading] = useState<boolean>(true);

  // Search value for filtering the options.
  const [searchValue, setSearchValue] = useState<string>("");

  const [selectAll, setSelectAll] = useState<boolean>(false);

  // These are all the possible columns displayed to the user.
  const [columnOptions, setColumnOptions] = useState<TableColumn<TData>[]>([]);

  // Stores all of the options selected but not applied yet.
  const [nonAppliedOptions, setNonAppliedOptions] = useState<
    NonAppliedOptionChange<TData>[]
  >([]);

  // Local storage of the displayed columns that are saved.
  const [localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<any[] | undefined>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  useEffect(() => {
    if (
      !localStorageDisplayedColumns ||
      localStorageDisplayedColumns?.length === 0
    ) {
      // No local storage to load from, load the default columns in.
      setDisplayedColumns(defaultColumns);
    }
  }, [localStorageDisplayedColumns]);

  // useEffect(() => {
  //   console.log(nonAppliedOptions);
  // }, [nonAppliedOptions]);

  const {
    show: showMenu,
    showDropdown: showDropdownMenu,
    hideDropdown: hideDropdownMenu,
    onKeyDown: onKeyPressDown
  } = menuDisplayControl();

  function menuDisplayControl() {
    const [show, setShow] = useState(false);

    const showDropdown = async () => {
      // Check if the dropdown has been loaded yet, if not then load in dynamic fields.
      if (loading) {
        // This will be where the dynamic fields will be loaded in...
        await getColumnSelectorIndexMapColumns<TData>({
          indexMapping,
          setColumnOptions,
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

    // If field extension we want to search by the field value or the package.
    // if ((item as any)?.columnMapping?.dynamicField?.type === "fieldExtension") {
    //   return (item as any)?.
    // }
    // console.log(startCase(item.id));
    return item?.id?.toLowerCase()?.indexOf(searchValue.toLowerCase()) !== -1;
  }

  /**
   * This function is used to determine if a checkbox is selected or not. It checks the displayed
   * columns and the nonAppliedOptions to see if it should be checked or not.
   *
   * @param columnId the column ID of the column being checked.
   * @returns true if it shuold be checked, false if not.
   */
  function isChecked(columnId: string | undefined): boolean {
    // First check the nonAppliedOptions if it has been altered.
    const nonAppliedFound = nonAppliedOptions.find(
      (item) => item.column.id === columnId
    );
    if (nonAppliedFound !== undefined) {
      return nonAppliedFound.state;
    }

    // Now check if it's currently being displayed on the table, but not applied yet.
    const displayedColumnFound = displayedColumns.find(
      (item) => item.id === columnId
    );
    if (displayedColumnFound !== undefined) {
      return true;
    }

    return false;
  }

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
  function applyFilterColumns() {
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
  }

  const CheckboxItem = React.forwardRef((props: any, ref) => {
    return (
      <Checkbox
        key={props.id}
        id={props.id}
        isChecked={props.isChecked}
        isField={props.isField}
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
            padding: "1.25rem 1.25rem 1.25rem 1.25rem",
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
          )}
          {
            <>
              <div className="d-flex gap-2 column-selector-apply-button">
                {!menuOnly && (
                  <Button
                    disabled={loading || nonAppliedOptions.length === 0}
                    className="btn btn-primary mt-1 mb-2 bulk-edit-button w-100"
                    onClick={applyFilterColumns}
                  >
                    {loading ? (
                      <LoadingSpinner loading={loading} />
                    ) : (
                      formatMessage({ id: "applyButtonText" }) +
                      (nonAppliedOptions.length > 0
                        ? " (" + nonAppliedOptions.length + ")"
                        : "")
                    )}
                  </Button>
                )}
              </div>
            </>
          }
          {props.children}
        </div>
      );
    }
  );

  return menuOnly ? (
    <ColumnSelectorMenu>
      <Dropdown.Item
        id="selectAll"
        handleClick={handleToggleAll}
        isChecked={selectAll}
        as={CheckboxItem}
      />
      {columnOptions.filter(searchFilter).map((column) => {
        return (
          <>
            <Dropdown.Item
              key={column?.id}
              id={column?.id}
              isChecked={isChecked(column?.id)}
              handleClick={() => toggleColumn(column?.id)}
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
        {loading ? (
          <LoadingSpinner loading={loading} />
        ) : (
          <>
            <Dropdown.Item
              id="selectAll"
              handleClick={handleToggleAll}
              isChecked={selectAll}
              as={CheckboxItem}
            />
            {columnOptions.filter(searchFilter).map((column) => {
              return (
                <>
                  <Dropdown.Item
                    key={column?.id}
                    id={column?.id}
                    isChecked={isChecked(column?.id)}
                    handleClick={() => toggleColumn(column?.id)}
                    as={CheckboxItem}
                  />
                </>
              );
            })}
          </>
        )}
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
