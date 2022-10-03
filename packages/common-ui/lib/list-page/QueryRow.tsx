import { useState } from "react";
import { QueryLogicSwitchField, SelectField, TextField } from "..";
import { FaPlus, FaMinus } from "react-icons/fa";
import moment from "moment";
import { FormikContextType, useFormikContext } from "formik";
import lodash, { startCase } from "lodash";
import { ESIndexMapping, TypeVisibility } from "./types";
import { useIntl } from "react-intl";
import QueryRowBooleanSearch from "./query-row-search-options/QueryRowBooleanSearch";
import QueryRowTextSearch from "./query-row-search-options/QueryRowTextSearch";
import QueryRowDateSearch from "./query-row-search-options/QueryRowDateSearch";
import QueryRowNumberSearch from "./query-row-search-options/QueryRowNumberSearch";
import QueryRowAutoSuggestionTextSearch from "./query-row-search-options/QueryRowAutoSuggestionSearch";

export interface QueryRowProps {
  /** Index name passed from the QueryPage component. */
  indexName: string;

  esIndexMapping: ESIndexMapping[];
  index: number;
  addRow?: () => void;
  removeRow?: (index) => void;
  name: string;
  formik?: FormikContextType<any>;
}

export interface QueryRowExportProps {
  /**
   * Name of the field for the search. Selected from the dropdown menu in the query row.
   */
  fieldName: string;

  /**
   * The value being searched on the query row. This is only used for strings. Other types have
   * their own field where it's stored.
   */
  matchValue?: string;

  /**
   * Changes based on the type of the field.
   *
   * Possible Options: "equals", "contains", "notEquals", "empty", "notEmpty", "greaterThan",
   *                   "lessThan", "greaterThanOrEqualTo", "lessThanOrEqualTo"
   */
  matchType?:
    | "equals"
    | "contains"
    | "notEquals"
    | "empty"
    | "notEmpty"
    | "greaterThan"
    | "lessThan"
    | "greaterThanOrEqualTo"
    | "lessThanOrEqualTo";

  /**
   * For text based searches you can change the match type to show only when the search is exactly
   * the same as the matchValue or partial match.
   *
   * Possible Options: "exact" and "partial".
   */
  textMatchType?: "exact" | "partial";

  /**
   * Currently, only "and" is supported. In the future, "or" can be selected.
   *
   * Possible Options: "and" and "or".
   */
  compoundQueryType?: "and" | "or";

  /**
   * When searching numbers, the value will be stored here. Only if the type is "number".
   */
  number?: string;

  /**
   * When searching dates, the value will be stored here. Only if the type is "date".
   */
  date?: string;

  /**
   * When searching booleans, the value will be stored here. Only if the type is "boolean".
   */
  boolean?: string;

  /**
   * Based on the field selected, the type of that field is stored here.
   */
  type?: string;

  /**
   * If the field is a relationship, this is the relationship name.
   *
   * Example: "author"
   */
  parentName?: string;

  /**
   * If the field is a relationship, this is the relationship type.
   *
   * Example: "agent"
   */
  parentType?: string;

  /**
   * If the field is a relationship, this is the relationship field being used.
   *
   * Example: "firstName"
   */
  parentPath?: string;

  /**
   * Is the value being searched on a distinct field, if so, suggestions can be provided to help
   * the user find what they are searching for.
   */
  distinctTerm?: boolean;
}

/**
 * Helper function to generate the proper form name.
 *
 * @param queryBuilderName the form name of the query builder, all query builder form items need
 *        to be prefixed with this.
 * @param fieldName the name of the field in relation to the query builder.
 * @param index the index of the field in the query builder. Since the QueryBuilder can support
 *        multiple fields at once, the index is used to determine which query row is used.
 */
export function fieldProps(
  queryBuilderName: string,
  fldName: string,
  index: number
) {
  return `${queryBuilderName}[${index}].${fldName}`;
}

export function QueryRow(queryRowProps: QueryRowProps) {
  const formikProps = useFormikContext();
  const { esIndexMapping, index, addRow, removeRow, name, indexName } =
    queryRowProps;
  const { formatMessage, messages } = useIntl();

  const [fieldName, setFieldName] = useState<string>(
    (formikProps.values as any)?.queryRows?.[index].fieldName
  );

  const dataFromIndexMapping = esIndexMapping?.find(
    (attribute) => attribute.value === fieldName
  );

  // Depending on the type, it changes what fields need to be displayed.
  const typeVisibility: TypeVisibility = {
    isText:
      dataFromIndexMapping?.type === "text" &&
      dataFromIndexMapping?.distinctTerm !== true,
    isSuggestedText: dataFromIndexMapping?.distinctTerm === true,
    isBoolean: dataFromIndexMapping?.type === "boolean",
    isNumber:
      dataFromIndexMapping?.type === "long" ||
      dataFromIndexMapping?.type === "short" ||
      dataFromIndexMapping?.type === "integer" ||
      dataFromIndexMapping?.type === "byte" ||
      dataFromIndexMapping?.type === "double" ||
      dataFromIndexMapping?.type === "float" ||
      dataFromIndexMapping?.type === "half_float" ||
      dataFromIndexMapping?.type === "scaled_float" ||
      dataFromIndexMapping?.type === "unsigned",
    isDate: dataFromIndexMapping?.type === "date"
  };

  function onSelectionChange(value) {
    const newDataFromIndexMapping = esIndexMapping.find(
      (attribute) => attribute.value === value
    );

    // Get existing value to transfer over.
    const previousValues = (formikProps.values as any)?.queryRows?.[index];

    formikProps.setFieldValue(`${name}[${index}]`, {
      matchType: "equals",
      boolean: previousValues?.boolean ?? "true",
      date: previousValues?.date ?? moment().format("YYYY-MM-DD"),
      matchValue: previousValues?.matchValue ?? null,
      number: previousValues?.number ?? null,
      fieldName: value,
      type: newDataFromIndexMapping?.type ?? "text",
      parentPath: newDataFromIndexMapping?.parentPath,
      parentName: newDataFromIndexMapping?.parentName,
      parentType: newDataFromIndexMapping?.parentType,
      distinctTerm: newDataFromIndexMapping?.distinctTerm
    });

    setFieldName(value);
  }

  // Get all of the attributes from the index for the filter dropdown.
  const simpleRowOptions = esIndexMapping
    ?.filter((prop) => !prop.parentPath)
    ?.map((prop) => ({
      label: messages["field_" + prop.label]
        ? formatMessage({ id: "field_" + prop.label })
        : startCase(prop.label),
      value: prop.value
    }))
    ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

  // Get all the relationships for the search dropdown.
  const nestedRowOptions = esIndexMapping
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

  const queryRowOptions = simpleRowOptions
    ? [...simpleRowOptions, ...groupedNestRowOptions]
    : [];

  // Custom styling to indent the group option menus.
  const customStyles = {
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
  };

  return (
    <div className="row">
      <div className="col-md-6 d-flex">
        {index > 0 && (
          <div style={{ width: index > 0 ? "8%" : "100%" }}>
            <QueryLogicSwitchField
              name={fieldProps(name, "compoundQueryType", index)}
              removeLabel={true}
              className={"compoundQueryType" + index}
            />
          </div>
        )}
        <div style={{ width: index > 0 ? "92%" : "100%" }}>
          <SelectField
            name={fieldProps(name, "fieldName", index)}
            options={queryRowOptions as any}
            onChange={onSelectionChange}
            className={`flex-grow-1 me-2 ps-0`}
            removeLabel={true}
            styles={customStyles}
          />
        </div>
      </div>
      <div className="col-md-6">
        <div className="d-flex">
          {/* Number type */}
          {typeVisibility.isNumber && (
            <QueryRowNumberSearch queryBuilderName={name} index={index} />
          )}

          {/* Boolean field (Dropdown with TRUE/FALSE) */}
          {typeVisibility.isBoolean && (
            <QueryRowBooleanSearch queryBuilderName={name} index={index} />
          )}

          {/* Disabled text field when no search filter is selected. */}
          {!fieldName && (
            <TextField
              name={fieldProps(name, "matchValue", index)}
              className="me-1 flex-fill"
              removeLabel={true}
              readOnly={true}
            />
          )}

          {/* Plus / Minus Buttons */}
          {index === 0 ? (
            <>
              {fieldName && (
                <FaPlus
                  onClick={addRow as any}
                  size="2em"
                  style={{ cursor: "pointer" }}
                  name={fieldProps(name, "addRow", index)}
                />
              )}
            </>
          ) : (
            <FaMinus
              onClick={() => removeRow?.(index)}
              size="2em"
              style={{ cursor: "pointer" }}
              name={fieldProps(name, "removeRow", index)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
