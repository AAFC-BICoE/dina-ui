import useLocalStorage from "@rehooks/local-storage";
import { KitsuResource } from "kitsu";
import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { useApiClient } from "../api-client/ApiClientContext";
import {
  DynamicFieldsMappingConfig,
  ESIndexMapping,
  TableColumn
} from "../list-page/types";
import { ColumnSelectorList } from "./ColumnSelectorList";
import { generateColumnDefinition } from "./ColumnSelectorUtils";
import { DataExportTemplate } from "../../../dina-ui/types/dina-export-api";
import { FaColumns } from "react-icons/fa";

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
   * When provided, it will be set as the setDisplayedColumns. This is populated from the
   * saved export hook.
   */
  overrideDisplayedColumns?: DataExportTemplate;

  /**
   * Should only be set to empty, indicating it has been processed.
   */
  setOverrideDisplayedColumns?: React.Dispatch<
    React.SetStateAction<DataExportTemplate | undefined>
  >;

  /**
   * IDs of the columns that should always be displayed and cannot be deleted.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   */
  mandatoryDisplayedColumns?: string[];

  /**
   * IDs of the columns that should always be displayed and cannot be deleted.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   */
  nonExportableColumns?: string[];

  /**
   * The default columns to be loaded in if no columns are found in the local storage.
   */
  defaultColumns?: TableColumn<TData>[];

  /**
   * Indicate if all the columns have been loading in...
   */
  setColumnSelectorLoading?: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * Array of relationshipType columns to be excluded from the dropdown menu
   */
  excludedRelationshipTypes?: string[];

  /**
   * Should all the input/buttons be disabled, Helpful if loading and do not want user to
   * interact with fields.
   */
  disabled?: boolean;
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
    setDisplayedColumns,
    overrideDisplayedColumns,
    excludedRelationshipTypes,
    mandatoryDisplayedColumns
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

  // Inject mandatory columns if they're missing from local storage
  useEffect(() => {
    if (mandatoryDisplayedColumns) {
      const updatedColumns = [
        ...new Set([
          ...mandatoryDisplayedColumns,
          ...localStorageDisplayedColumns
        ])
      ];

      if (updatedColumns.length !== localStorageDisplayedColumns.length) {
        setLocalStorageDisplayedColumns(updatedColumns);
      }
    }
  }, [props.displayedColumns]);

  useEffect(() => {
    let injectedMappings: (ESIndexMapping | undefined)[] = [];

    if (indexMapping !== undefined) {
      if (defaultColumns) {
        injectedMappings = defaultColumns
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
              value: column.id ?? column.label ?? "",
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

        // Combine index mapping fields.
        injectedMappings = [
          ...indexMapping,
          ...(injectedMappings as ESIndexMapping[])
        ];
      } else {
        // Combine index mapping fields.
        injectedMappings = indexMapping;
      }

      // Remove excluded relationships from the list if provided.
      if (excludedRelationshipTypes && excludedRelationshipTypes?.length > 0) {
        injectedMappings = injectedMappings.filter((mapping) => {
          return mapping?.parentType
            ? !excludedRelationshipTypes.includes(mapping?.parentType)
            : true;
        });
      }

      // Add UUID field as an additional field.
      injectedMappings = injectedMappings.concat(
        {
          label: "id",
          value: "id",
          path: "id",
          hideField: false,
          type: "text",
          containsSupport: false,
          distinctTerm: false,
          endsWithSupport: false,
          keywordMultiFieldSupport: false,
          keywordNumericSupport: false,
          optimizedPrefix: false,
          dynamicField: undefined
        },
        {
          label: "columnFunction",
          value: "columnFunction",
          path: "columnFunction",
          hideField: false,
          type: "columnFunction",
          dynamicField: {
            type: "columnFunction",
            label: "columnFunction",
            path: ""
          },
          containsSupport: false,
          distinctTerm: false,
          keywordMultiFieldSupport: false,
          keywordNumericSupport: false,
          optimizedPrefix: false,
          endsWithSupport: false
        }
      );

      // Finally, set it as the state.
      setInjectedIndexMapping(injectedMappings as ESIndexMapping[]);
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

        setLoading(false);
        setColumnSelectorLoading?.(false);
      }
    }

    async function loadColumnsFromSavedExport() {
      if (injectedIndexMapping && overrideDisplayedColumns) {
        const promises = overrideDisplayedColumns?.columns?.map?.(
          async (localColumn, index) => {
            const columnFunctionPath = localColumn.includes("function")
              ? overrideDisplayedColumns.functions?.[localColumn]
                  .functionDef === "CONCAT"
                ? `columnFunction/${localColumn}/${
                    overrideDisplayedColumns.functions?.[localColumn]
                      .functionDef
                  }/${overrideDisplayedColumns.functions?.[
                    localColumn
                  ].params.join("+")}`
                : `columnFunction/${localColumn}/${overrideDisplayedColumns.functions?.[localColumn].functionDef}`
              : undefined;

            const newColumnDefinition = await generateColumnDefinition({
              indexMappings: injectedIndexMapping,
              dynamicFieldsMappingConfig,
              apiClient,
              defaultColumns,
              path: columnFunctionPath ?? localColumn
            });
            // Set the column header if saved.
            if (newColumnDefinition) {
              newColumnDefinition.exportHeader =
                overrideDisplayedColumns?.columnAliases?.[index] ?? "";
            }

            return newColumnDefinition;
          }
        );
        if (promises) {
          const columns = (await Promise.all(promises)).filter(isDefinedColumn);
          setDisplayedColumns(columns);

          setLoading(false);
          setColumnSelectorLoading?.(false);
        }
      }
    }

    // Check if overrides are provided from the saved exports.
    if (overrideDisplayedColumns) {
      loadColumnsFromSavedExport();
      return;
    }

    if (
      !localStorageDisplayedColumns ||
      localStorageDisplayedColumns?.length === 0
    ) {
      // Set the default columns into local storage.
      if (defaultColumns) {
        setLocalStorageDisplayedColumns(
          defaultColumns.map((column) => column?.id ?? "")
        );
      }
    }

    loadColumnsFromLocalStorage();
  }, [
    localStorageDisplayedColumns,
    injectedIndexMapping,
    overrideDisplayedColumns
  ]);

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
          <FaColumns className="me-2" />
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
