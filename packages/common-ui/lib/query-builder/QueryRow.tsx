import { useState } from "react";
import {
  DateField,
  NumberField,
  QueryLogicSwitchField,
  SelectField,
  TextField
} from "..";
import { useElasticSearchDistinctTerm } from "./useElasticSearchDistinctTerm";
import { AutoSuggestTextField } from "../formik-connected/AutoSuggestTextField";
import { FaPlus, FaMinus } from "react-icons/fa";
import moment from "moment";
import { FormikContextType, useFormikContext } from "formik";
import lodash from "lodash";

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

/**
 * The full path will be generated for elastic using a combination of the parent path and
 * the value. The path is generated using the following:
 *
 * {parentPath}.{path}.{value}
 *
 * Example: included.attributes.determination.verbatimScientificName
 */
export interface ESIndexMapping {
  /**
   * Name of the attribute.
   *
   * Example: verbatimScientificName
   */
  value: string;

  /**
   * Text that is displayed to the user in the Query Filtering option menu.
   *
   * This text is a user-friendly generated label, which may show some paths to help the user
   * understand the relationships better. This is generated from the path.
   *
   * Example: determination.verbatimScientificName
   */
  label: string;

  /**
   * The attributes type. This can change how the query row is displayed and the options provided.
   *
   * Examples: text, keyword, boolean, date, boolean, long, short, integer...
   */
  type: string;

  /**
   * If enabled, it will allow the user to see suggestions as they type. The suggestions will come
   * from elastic search based on most common values saved.
   *
   * Only available for the text type.
   */
  distinctTerm: boolean;

  /**
   * The path for the attribute without the attribute name. This path does not include the parent
   * path.
   *
   * Example: attribute.determination
   */
  path: string;

  /**
   * If the attribute belongs to a relationship, this is the path for only the parent. When generating
   * the elastic search query it will use this as the prefix of the path.
   *
   * Example: included
   */
  parentPath?: string;

  /**
   * If the attribute belongs to a relationship, this is the name which will be used to group
   * attributes under the same relationship together in the search. This name will also be used to
   * display text of the group.
   *
   * Example: organism
   */
  parentName?: string;
}

export type QueryRowMatchValue = "match" | "term";
export type QueryRowMatchType = "PARTIAL_MATCH" | "EXACT_MATCH" | "BLANK_FIELD";
export type QueryRowBooleanType = "TRUE" | "FALSE";
export type QueryRowNumberType =
  | "long"
  | "short"
  | "integer"
  | "byte"
  | "double"
  | "float"
  | "half_float"
  | "scaled_float"
  | "unsigned_long";

export interface QueryRowExportProps {
  fieldName: string;
  matchValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  matchType?: string;
  compoundQueryType?: string;
  number?: string;
  date?: string;
  boolean?: string;
  type?: string;
  parentName?: string;
  parentPath?: string;
}

interface TypeVisibility {
  isText: boolean;
  isSuggestedText: boolean;
  isBoolean: boolean;
  isNumber: boolean;
  isDate: boolean;
}

const queryRowMatchOptions = [
  { label: "PARTIAL_MATCH", value: "match" },
  { label: "EXACT_MATCH", value: "term" }
];

const queryRowBooleanOptions = [
  { label: "TRUE", value: "true" },
  { label: "FALSE", value: "false" }
];

export function QueryRow(queryRowProps: QueryRowProps) {
  const formikProps = useFormikContext();
  const { esIndexMapping, index, addRow, removeRow, name, indexName } =
    queryRowProps;

  const initState = {
    matchValue: null,
    matchType: "match",
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
  const [typeVisibility, setTypeVisibility] = useState<TypeVisibility>({
    isText: dataFromIndexMapping?.type === "text",
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
  });

  function onSelectionChange(value) {
    const newDataFromIndexMapping = esIndexMapping.find(
      attribute => attribute.value === value
    );

    formikProps.setFieldValue(`${name}[${index}]`, {
      ...initState,
      fieldName: value,
      type: newDataFromIndexMapping?.type ?? "text",
      parentPath: newDataFromIndexMapping?.parentPath,
      parentName: newDataFromIndexMapping?.parentName
    });

    setTypeVisibility({
      isText: newDataFromIndexMapping?.type === "text",
      isSuggestedText: dataFromIndexMapping?.distinctTerm === true,
      isBoolean: newDataFromIndexMapping?.type === "boolean",
      isNumber:
        newDataFromIndexMapping?.type === "long" ||
        newDataFromIndexMapping?.type === "short" ||
        newDataFromIndexMapping?.type === "integer" ||
        newDataFromIndexMapping?.type === "byte" ||
        newDataFromIndexMapping?.type === "double" ||
        newDataFromIndexMapping?.type === "float" ||
        newDataFromIndexMapping?.type === "half_float" ||
        newDataFromIndexMapping?.type === "scaled_float" ||
        newDataFromIndexMapping?.type === "unsigned",
      isDate: newDataFromIndexMapping?.type === "date"
    });

    setFieldName(value);
  }

  // Get all of the attributes from the index for the filter dropdown.
  const simpleRowOptions = esIndexMapping
    ?.filter(prop => !prop.parentPath)
    ?.map(prop => ({
      label: prop.label,
      value: prop.value
    }));

  // Get all the relationships for the search dropdown.
  const nestedRowOptions = esIndexMapping
    ?.filter(prop => !!prop.parentPath)
    ?.map(prop => {
      return {
        parentName: prop.parentName,
        label: prop.label,
        value: prop.value
      };
    });

  // Using the parent name, group the relationships into sections.
  const groupedNestRowOptions = lodash
    .chain(nestedRowOptions)
    .groupBy(prop => prop.parentName)
    .map((group, key) => {
      return {
        label: key,
        options: group
      };
    })
    .value();

  const queryRowOptions = simpleRowOptions
    ? [...simpleRowOptions, ...groupedNestRowOptions]
    : [];

  function fieldProps(fldName: string, idx: number) {
    return `${name}[${idx}].${fldName}`;
  }

  return (
    <div className="row">
      <div className="col-md-6 d-flex">
        {index > 0 && (
          <div style={{ width: index > 0 ? "8%" : "100%" }}>
            <QueryLogicSwitchField
              name={fieldProps("compoundQueryType", index)}
              removeLabel={true}
              className={"compoundQueryType" + index}
            />
          </div>
        )}
        <div style={{ width: index > 0 ? "92%" : "100%" }}>
          <SelectField
            name={fieldProps("fieldName", index)}
            options={queryRowOptions as any}
            onChange={onSelectionChange}
            className={`flex-grow-1 me-2 ps-0`}
            removeLabel={true}
          />
        </div>
      </div>
      <div className="col-md-6">
        <div className="d-flex">
          {typeVisibility.isText && !typeVisibility.isSuggestedText && (
            <TextField
              name={fieldProps("matchValue", index)}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {typeVisibility.isSuggestedText && (
            <AutoSuggestTextField
              name={fieldProps("matchValue", index)}
              removeLabel={true}
              className="me-1 flex-fill"
              alwaysShowSuggestions={true}
              suggestions={value =>
                useElasticSearchDistinctTerm({
                  fieldName,
                  indexName
                }).filter(suggestion =>
                  suggestion.toLowerCase().includes(value.toLowerCase())
                )
              }
            />
          )}
          {typeVisibility.isDate && (
            <DateField
              name={fieldProps("date", index)}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {typeVisibility.isText && (
            <SelectField
              name={fieldProps("matchType", index)}
              options={queryRowMatchOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {typeVisibility.isBoolean && (
            <SelectField
              name={fieldProps("boolean", index)}
              options={queryRowBooleanOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {typeVisibility.isNumber && (
            <NumberField
              name={fieldProps("number", index)}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}

          {/* Disabled text field when no search filter is selected. */}
          {!fieldName && (
            <TextField
              name={fieldProps("matchValue", index)}
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
                  name={fieldProps("addRow", index)}
                />
              )}
            </>
          ) : (
            <FaMinus
              onClick={() => removeRow?.(index)}
              size="2em"
              style={{ cursor: "pointer" }}
              name={fieldProps("removeRow", index)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
