import lodash, { startCase, flatMapDeep } from "lodash";
import { DinaMessage } from "../../../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import CreatableSelect from "react-select/creatable";
import { ESIndexMapping } from "../../types";
import { GLOBAL_SEARCH_FIELDNAME } from "../useQueryBuilderConfig";
import { useSessionStorage } from "usehooks-ts";
import { SHORTCUT_GLOBAL_SEARCH_QUERY } from "../query-builder-value-types/QueryBuilderGlobalSearch";

interface QueryFieldSelectorProps {
  /** The CSS classes of the div wrapper. */
  className?: string;
  /**
   * Elastic search map loaded from the query builder. This is used to populate the options for
   * the query field selector.
   */
  indexMap: ESIndexMapping[];

  /**
   * Field selected from the Query Builder.
   */
  currentField?: string;

  /**
   * Pass the selected option to the Query Builder.
   */
  setField: ((fieldPath: string) => void) | undefined;

  /**
   * Is this component being used in the column selector, this changes the placeholder and
   * displays different options not available for the search.
   */
  isInColumnSelector: boolean;

  /**
   * IDs of the columns that should not be displayed in the Query Builder field selector.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   *
   * Used for the column selector.
   */
  nonSearchableColumns?: string[];
}

export function QueryFieldSelector({
  className,
  indexMap,
  currentField,
  setField,
  isInColumnSelector = false,
  nonSearchableColumns
}: QueryFieldSelectorProps) {
  const { formatMessage, messages, locale } = useIntl();

  const [isGlobalSearch, setIsGlobalSearch] = useState<boolean>(false);

  // Check if we are currently in global search mode.
  useEffect(() => {
    if (currentField === GLOBAL_SEARCH_FIELDNAME && !isGlobalSearch) {
      setIsGlobalSearch(true);
    } else {
      setIsGlobalSearch(false);
    }
  }, [currentField]);

  // If using the shortcut for global search.
  const [_globalSearchQuery, setGlobalSearchQuery] = useSessionStorage<
    string | undefined
  >(SHORTCUT_GLOBAL_SEARCH_QUERY, undefined, {
    initializeWithValue: false
  });

  // Generate the options that can be selected for the field dropdown.
  const queryRowOptions = useMemo(() => {
    // Get all of the attributes from the index for the filter dropdown.
    const simpleRowOptions = indexMap
      ?.filter((prop) => !prop.parentPath)
      ?.filter((prop) => prop.hideField === false)
      ?.filter(
        (prop) =>
          !(nonSearchableColumns ?? []).some((id) =>
            (prop?.label ?? "").startsWith(id)
          )
      )
      ?.map((prop) => ({
        label: messages["field_" + prop.label]
          ? formatMessage({ id: "field_" + prop.label })
          : startCase(prop.label),
        value: prop.value
      }))
      ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

    // Get all the relationships for the search dropdown.
    const nestedRowOptions = indexMap
      ?.filter((prop) => !!prop.parentPath)
      ?.filter((prop) => prop.hideField === false)
      ?.filter(
        (prop) =>
          !(nonSearchableColumns ?? []).some((id) =>
            (prop?.value ?? "").startsWith(id)
          )
      )
      ?.map((prop) => {
        // Supports field_[parentName]_[name] and field_[name] translations.
        return {
          parentName: prop.parentName,
          label: messages["field_" + prop.parentName + "_" + prop.label]
            ? formatMessage({
                id: "field_" + prop.parentName + "_" + prop.label
              })
            : messages["field_" + prop.label]
            ? formatMessage({ id: "field_" + prop.label })
            : startCase(prop.label),
          value: prop.value
        };
      })
      ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

    // Using the parent name, group the relationships into sections.
    const groupedNestRowOptions = lodash
      .chain(nestedRowOptions)
      .groupBy((prop) => prop.parentName)
      .map((group, key) => {
        return {
          label: messages["title_" + key]
            ? formatMessage({ id: "title_" + key })
            : startCase(key),
          options: group
        };
      })
      .sort((aProp, bProp) => aProp.label.localeCompare(bProp.label))
      .value();

    return simpleRowOptions
      ? [...simpleRowOptions, ...groupedNestRowOptions]
      : [];
  }, [indexMap, locale, nonSearchableColumns]);

  // Custom styling to indent the group option menus.
  const customStyles = useMemo(
    () => ({
      placeholder: (provided, _) => ({
        ...provided,
        color: "rgb(87,120,94)"
      }),
      menu: (base) => ({ ...base, zIndex: 1050 }),
      control: (base) => ({
        ...base
      }),
      // Grouped options (relationships) should be indented.
      option: (baseStyle, { data }) => {
        if (data?.parentName) {
          return {
            ...baseStyle,
            paddingLeft: "25px"
          };
        }

        // Default style for everything else.
        return {
          ...baseStyle
        };
      },

      // When viewing a group item, the parent name should be prefixed on to the value.
      singleValue: (baseStyle, { data }) => {
        if (data?.parentName) {
          return {
            ...baseStyle,
            ":before": {
              content: `'${
                messages["title_" + data.parentName]
                  ? formatMessage({ id: "title_" + data.parentName })
                  : startCase(data.parentName)
              } - '`
            }
          };
        }

        return {
          ...baseStyle
        };
      }
    }),
    [indexMap, locale]
  );

  // Find the selected option in the index map if possible.
  // Needs to support nested items.
  const selectedOption = useMemo(() => {
    const getNestedOptions = (dropdownItem) => {
      if ((dropdownItem as any)?.options) {
        return [
          dropdownItem,
          flatMapDeep(dropdownItem.options, getNestedOptions)
        ];
      }
      return dropdownItem;
    };

    return flatMapDeep(queryRowOptions, getNestedOptions).find(
      (dropdownItem) => {
        if ((dropdownItem as any)?.value) {
          return (dropdownItem as any).value === currentField;
        }
        return false;
      }
    );
  }, [currentField, locale]);

  const globalSearchOptionSelected = {
    label: formatMessage({ id: "queryBuilder_globalSearch" }),
    value: GLOBAL_SEARCH_FIELDNAME
  };

  const performGlobalSearch = (inputValue: string) => {
    // Check if a search was provided during typing, if so save it to the session so it can pre-loaded
    // in the QueryBuilderGlobalSearch.
    if (inputValue !== "") {
      setGlobalSearchQuery(inputValue);
    }

    setField?.(GLOBAL_SEARCH_FIELDNAME);
  };

  return (
    <div className={className} style={{ width: "100%" }}>
      {/* Field Selection */}
      <CreatableSelect
        options={queryRowOptions as any}
        className={isInColumnSelector ? "ps-0" : "flex-grow-1 me-2 ps-0"}
        styles={customStyles}
        value={isGlobalSearch ? globalSearchOptionSelected : selectedOption}
        placeholder={
          isInColumnSelector ? (
            <DinaMessage id="columnSelector_field_placeholder" />
          ) : (
            <DinaMessage id="queryBuilder_field_placeholder" />
          )
        }
        onChange={(selected) => setField?.(selected?.value)}
        // Global Search Specific Props
        createOptionPosition={"first"}
        formatCreateLabel={(inputValue) =>
          inputValue === ""
            ? formatMessage({ id: "queryBuilder_globalSearch" })
            : formatMessage(
                { id: "queryBuilder_globalSearch_withText" },
                { globalSearchTerm: inputValue }
              )
        }
        isValidNewOption={(_inputValue) => !isInColumnSelector}
        onCreateOption={performGlobalSearch}
        captureMenuScroll={true}
        menuPlacement={isInColumnSelector ? "bottom" : "auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
      />
    </div>
  );
}
