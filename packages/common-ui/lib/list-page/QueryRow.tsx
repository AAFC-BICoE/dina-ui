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
  fieldName: string;
  matchValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  matchType?: string;
  numericalMatchType?: string;
  compoundQueryType?: string;
  number?: string;
  date?: string;
  boolean?: string;
  type?: string;
  parentName?: string;
  parentType?: string;
  parentPath?: string;
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

  const initState = {
    matchValue: null,
    matchType: "match",
    numericalMatchType: "equal",
    date: moment().format("YYYY-MM-DD"),
    boolean: "true",
    number: null
  };

  const [fieldName, setFieldName] = useState<string>(
    (formikProps.values as any)?.queryRows?.[index].fieldName
  );

  const dataFromIndexMapping = esIndexMapping?.find(
    attribute => attribute.value === fieldName
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
      attribute => attribute.value === value
    );

    formikProps.setFieldValue(`${name}[${index}]`, {
      ...initState,
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
    ?.filter(prop => !prop.parentPath)
    ?.map(prop => ({
      label: messages["field_" + prop.label]
        ? formatMessage({ id: "field_" + prop.label })
        : startCase(prop.label),
      value: prop.value
    }))
    ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

  // Get all the relationships for the search dropdown.
  const nestedRowOptions = esIndexMapping
    ?.filter(prop => !!prop.parentPath)
    ?.map(prop => {
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
    .groupBy(prop => prop.parentName)
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
          {/* Text type */}
          {typeVisibility.isText && (
            <QueryRowTextSearch queryBuilderName={name} index={index} />
          )}

          {/* Auto suggestion text type */}
          {typeVisibility.isSuggestedText && (
            <QueryRowAutoSuggestionTextSearch
              indexName={indexName}
              queryBuilderName={name}
              index={index}
            />
          )}

          {/* Date picker type */}
          {typeVisibility.isDate && (
            <QueryRowDateSearch queryBuilderName={name} index={index} />
          )}

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
