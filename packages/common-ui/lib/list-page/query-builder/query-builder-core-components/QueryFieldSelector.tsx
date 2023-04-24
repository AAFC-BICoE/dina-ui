import lodash, { startCase, flatMapDeep } from "lodash";
import { DinaMessage } from "../../../../../dina-ui/intl/dina-ui-intl";
import React, { useMemo } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { ESIndexMapping } from "../../types";

interface QueryFieldSelectorProps {
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
}

export function QueryFieldSelector({
  indexMap,
  currentField,
  setField
}: QueryFieldSelectorProps) {
  const { formatMessage, messages, locale } = useIntl();

  // Generate the options that can be selected for the field dropdown.
  const queryRowOptions = useMemo(() => {
    // Get all of the attributes from the index for the filter dropdown.
    const simpleRowOptions = indexMap
      ?.filter((prop) => !prop.parentPath)
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
      ?.map((prop) => {
        return {
          parentName: prop.parentName,
          label: messages["field_" + prop.label]
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
  }, [indexMap, locale]);

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
              content: `'${startCase(data.parentName)} '`
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

  return (
    <div style={{ width: "100%" }}>
      {/* Field Selection */}
      <Select
        options={queryRowOptions as any}
        className={`flex-grow-1 me-2 ps-0`}
        styles={customStyles}
        value={selectedOption}
        placeholder={<DinaMessage id="queryBuilder_field_placeholder" />}
        onChange={(selected) => setField?.(selected?.value)}
      />
    </div>
  );
}
