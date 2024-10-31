import { GeneratorSelectorList } from "./GeneratorSelectorList";
import { useState, useEffect } from "react";
import React from "react";
import {
  DynamicField,
  DynamicFieldsMappingConfig,
  RelationshipDynamicField
} from "../list-page/types";
import { FieldOptionType } from "../../../dina-ui/components/workbook/utils/workbookMappingUtils";

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

  /**
   * Dynamic Configuration for this column.
   */
  dynamicConfig?: DynamicField | RelationshipDynamicField;
}

export interface GeneratorSelectorProps {
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
  const { setGeneratorSelectorLoading, setDisplayedColumns } = props;

  // Loading state, specifically for dynamically loaded columns.
  const [loading, setLoading] = useState<boolean>(true);

  // Load in the default values on load.
  useEffect(() => {
    setDisplayedColumns([]);
    setLoading(false);
    setGeneratorSelectorLoading?.(false);
  }, []);

  return <GeneratorSelectorList {...props} loading={loading} />;
}

export const GeneratorSelectorMemo = React.memo(GeneratorSelector);
