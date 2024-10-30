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
import { SavedExportColumnStructure } from "packages/dina-ui/types/user-api";
import { FieldOptionType } from "../../../dina-ui/components/workbook/utils/workbookMappingUtils";

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
   * Specific to the workbook template generator. This will filter the list so the index mapping
   * only contains supported fields for the generator as well as adding any missing fields.
   */
  generatorFields?: FieldOptionType[];

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
  overrideDisplayedColumns?: SavedExportColumnStructure;

  /**
   * Should only be set to empty, indicating it has been processed.
   */
  setOverrideDisplayedColumns?: React.Dispatch<
    React.SetStateAction<SavedExportColumnStructure | undefined>
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
    generatorFields,
    indexMapping,
    dynamicFieldsMappingConfig,
    uniqueName,
    defaultColumns,
    setColumnSelectorLoading,
    setDisplayedColumns,
    overrideDisplayedColumns,
    excludedRelationshipTypes
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
    let injectedMappings: (ESIndexMapping | undefined)[] = [];

    if (indexMapping !== undefined) {
      if (generatorFields) {
        injectedMappings = indexMapping;

        // Add missing index items from the generatorFields configuration
        const missingFields = generatorFields.filter(
          (generatorField) =>
            !injectedMappings.some(
              (mapping) => mapping?.label === generatorField.value
            )
        );

        missingFields.forEach((field: FieldOptionType) => {
          if (field.options && field.options.length !== 0) {
            field.options.forEach((parentField) => {
              // Search relationship dynamic configuration fields.
              const dynamicConfig =
                dynamicFieldsMappingConfig?.relationshipFields?.find(
                  (config) => {
                    return (
                      config.referencedBy === parentField.parentPath &&
                      config.path ===
                        "included.attributes." +
                          parentField.value?.split?.(".")?.pop?.()
                    );
                  }
                );

              // Skipping collecting event managed attributes for now, will be handled in the future.
              if (parentField.value === "collectingEvent.managedAttributes") {
                return;
              }

              injectedMappings.push({
                label: dynamicConfig?.label ?? parentField.label,
                path: parentField.value ?? parentField.label,
                type: "text",
                value: parentField.value ?? parentField.label,
                hideField: false,
                distinctTerm: false,
                keywordMultiFieldSupport: false,
                keywordNumericSupport: false,
                optimizedPrefix: false,
                containsSupport: false,
                endsWithSupport: false,
                parentName: field.label,
                parentPath: parentField.parentPath,
                dynamicField: dynamicConfig
              });
            });
          } else {
            // Search entity level dynamic field configurations.
            const dynamicConfig = dynamicFieldsMappingConfig?.fields?.find(
              (config) => {
                return config.path === "data.attributes." + field.value;
              }
            );

            // Skipping prepared managed attributes for now, will be handled in the future.
            if (field.value === "preparationManagedAttributes") {
              return;
            }

            injectedMappings.push({
              label: dynamicConfig?.label ?? field.label,
              path: field.value ?? field.label,
              type: "text",
              value: field.value ?? field.label,
              hideField: false,
              distinctTerm: false,
              keywordMultiFieldSupport: false,
              keywordNumericSupport: false,
              optimizedPrefix: false,
              containsSupport: false,
              endsWithSupport: false,
              dynamicField: dynamicConfig
            });
          }
        });

        setInjectedIndexMapping(injectedMappings as ESIndexMapping[]);
        return;
      }

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
      injectedMappings = injectedMappings.concat({
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
      });

      // Finally, set it as the state.
      setInjectedIndexMapping(injectedMappings as ESIndexMapping[]);
    }
  }, [indexMapping, defaultColumns, generatorFields]);

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

    async function loadColumnsFromSavedExport() {
      if (injectedIndexMapping && overrideDisplayedColumns) {
        const promises = overrideDisplayedColumns?.columns?.map?.(
          async (localColumn, index) => {
            const newColumnDefinition = await generateColumnDefinition({
              indexMappings: injectedIndexMapping,
              dynamicFieldsMappingConfig,
              apiClient,
              defaultColumns,
              path: localColumn
            });

            // Set the column header if saved.
            if (newColumnDefinition) {
              newColumnDefinition.exportHeader =
                overrideDisplayedColumns?.columnAliases?.[index] ?? "";
            }

            return newColumnDefinition;
          }
        );

        const columns = (await Promise.all(promises)).filter(isDefinedColumn);
        setDisplayedColumns(columns);
      }
    }

    // Generator fields do not need to load values.
    if (generatorFields) {
      setLoading(false);
      setColumnSelectorLoading?.(false);
      return;
    }

    // Check if overrides are provided from the saved exports.
    if (overrideDisplayedColumns) {
      loadColumnsFromSavedExport();
      setLoading(false);
      setColumnSelectorLoading?.(false);
      return;
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
      setLoading(false);
    } else {
      loadColumnsFromLocalStorage();
      setLoading(false);
      setColumnSelectorLoading?.(false);
    }
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
