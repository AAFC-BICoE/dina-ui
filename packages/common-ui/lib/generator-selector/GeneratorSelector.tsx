import { GeneratorSelectorList } from "./GeneratorSelectorList";
import { useState, useEffect } from "react";
import React from "react";
import { DynamicFieldsMappingConfig } from "../list-page/types";
import useLocalStorage from "@rehooks/local-storage";
import { FieldOptionType } from "../../../dina-ui/components/workbook/utils/workbookMappingUtils";

export const VISIBLE_INDEX_LOCAL_STORAGE_KEY = "visibleColumns";

/**
 * Used to keep track of all of the columns selected to be generated the aliases
 * that should be used.
 */
export interface GeneratorColumn {
  /**
   * Provided by the workbook configuration, the user-friendly label to display.
   *
   * This will also be used as the default alias if nothing is provided.
   */
  columnLabel: string;

  /**
   * The current alias, changed by the onGeneratorItemChangeAlias function.
   */
  columnAlias: string;

  /**
   * Used for referencing the column, this value never changes and is provided by
   * the workbook config.
   */
  columnValue: string;
}

export interface GeneratorSelectorProps {
  /**
   * A unique identifier to be used for local storage key
   */
  uniqueName?: string;

  /**
   * Specific to the workbook template generator. This will filter the list so the index mapping
   * only contains supported fields for the generator as well as adding any missing fields.
   */
  generatorFields?: FieldOptionType[];

  /**
   * Dynamic field mapping configuration.
   */
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig;

  /**
   * The currently displayed columns on the table.
   */
  displayedColumns: GeneratorColumn[];

  /**
   * Once the selection is applied, this will be used to set the current columns.
   */
  setDisplayedColumns: React.Dispatch<React.SetStateAction<GeneratorColumn[]>>;

  /**
   * Indicate if all the columns have been loading in...
   */
  setGeneratorSelectorLoading?: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * Should all the input/buttons be disabled, Helpful if loading and do not want user to
   * interact with fields.
   */
  disabled?: boolean;
}

export function GeneratorSelector(props: GeneratorSelectorProps) {
  const { uniqueName, setGeneratorSelectorLoading, setDisplayedColumns } =
    props;

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
    // async function loadColumnsFromLocalStorage() {
    // if (injectedIndexMapping) {
    //   const promises = localStorageDisplayedColumns.map(
    //     async (localColumn) => {
    //       const newColumnDefinition = await generateColumnDefinition({
    //         indexMappings: injectedIndexMapping,
    //         dynamicFieldsMappingConfig,
    //         apiClient,
    //         defaultColumns,
    //         path: localColumn
    //       });
    //       return newColumnDefinition;
    //     }
    //   );

    //   const columns = (await Promise.all(promises)).filter(isDefinedColumn);
    //   setDisplayedColumns(columns);
    // }
    // }

    if (
      !localStorageDisplayedColumns ||
      localStorageDisplayedColumns?.length === 0
    ) {
      // No local storage to load from, load the default columns in.
      setDisplayedColumns([]);
      setLoading(false);
    } else {
      // loadColumnsFromLocalStorage();
      setDisplayedColumns([]);
      setLoading(false);
      setGeneratorSelectorLoading?.(false);
    }
  }, [localStorageDisplayedColumns]);

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

  return <GeneratorSelectorList {...props} loading={loading} />;
}

export const GeneratorSelectorMemo = React.memo(GeneratorSelector);
