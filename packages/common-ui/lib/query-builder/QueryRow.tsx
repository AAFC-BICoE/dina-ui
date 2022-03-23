import { useState } from "react";
import {
  DateField,
  NumberField,
  QueryLogicSwitchField,
  SelectField,
  TextField
} from "..";
import { FaPlus, FaMinus } from "react-icons/fa";
import moment from "moment";
import { FormikContextType, useFormikContext } from "formik";
export interface QueryRowProps {
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
  | "unsiged_long";

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
  const { values } = useFormikContext();
  const { esIndexMapping, index, addRow, removeRow, name } = queryRowProps;
  const initVisibility = {
    text: false,
    date: false,
    boolean: false,
    number: false,
    numberRange: false,
    dateRange: false
  };
  const typeFromFieldName = (values as any)?.queryRows?.[
    index
  ]?.fieldName?.substring(
    (values as any)?.queryRows?.[index]?.fieldName?.indexOf("(") + 1,
    (values as any)?.queryRows?.[index]?.fieldName?.indexOf(")")
  );

  const fieldType = typeFromFieldName ?? esIndexMapping?.[0]?.type;

  const visibilityOverridden =
    fieldType === "boolean"
      ? { boolean: true }
      : fieldType === "long" ||
        fieldType === "short" ||
        fieldType === "integer" ||
        fieldType === "byte" ||
        fieldType === "double" ||
        fieldType === "float" ||
        fieldType === "half_float" ||
        fieldType === "scaled_float" ||
        fieldType === "unsiged_long"
      ? { number: true }
      : fieldType === "date"
      ? { date: true }
      : { text: true };
  const [visibility, setVisibility] = useState({
    ...initVisibility,
    ...visibilityOverridden
  });
  const initState = {
    matchValue: null,
    matchType: "match",
    date: moment().format("YYYY-MM-DD"),
    boolean: "true",
    number: null
  };

  function onSelectionChange(value, formik, idx) {
    const computedVal = typeof value === "object" ? value.name : value;
    const type = computedVal.substring(
      computedVal.indexOf("(") + 1,
      computedVal.indexOf(")")
    );
    const state = {
      ...formik.values?.[`${name}`]?.[`${idx}`],
      ...initState,
      fieldName: value
    };

    formik.setFieldValue(`${name}[${idx}]`, state);
    switch (type) {
      case "text":
      case "keyword": {
        return setVisibility({ ...initVisibility, text: true });
      }
      case "date": {
        return setVisibility({ ...initVisibility, date: true });
      }
      case "boolean": {
        return setVisibility({ ...initVisibility, boolean: true });
      }
      case "long":
      case "short":
      case "integer":
      case "byte":
      case "double":
      case "float":
      case "half_float":
      case "scaled_float":
      case "unsiged_long": {
        return setVisibility({ ...initVisibility, number: true });
      }
    }
  }

  const simpleRowOptions = esIndexMapping
    ?.filter(prop => !prop.parentPath)
    ?.map(prop => ({
      label: prop.label,
      value: prop.value + "(" + prop.type + ")"
    }));

  let nestedGroupLabel = "Nested Group";

  const nestedRowOptions = esIndexMapping
    ?.filter(prop => !!prop.parentPath)
    ?.map(prop => {
      nestedGroupLabel = prop.parentName as string;
      return {
        label: prop.label,
        value: prop.parentPath + "." + prop.value + "(" + prop.type + ")"
      };
    });

  const queryRowOptions = simpleRowOptions
    ? [
        ...simpleRowOptions,
        ...(nestedRowOptions?.length > 0
          ? [{ label: nestedGroupLabel, options: nestedRowOptions }]
          : [])
      ]
    : [];
  function fieldProps(fldName: string, idx: number) {
    return {
      name: `${name}[${idx}].${fldName}`
    };
  }
  return (
    <div className="row">
      <div className="col-md-6 d-flex">
        {index > 0 && (
          <div style={{ width: index > 0 ? "8%" : "100%" }}>
            <QueryLogicSwitchField
              name={fieldProps("compoundQueryType", index).name}
              removeLabel={true}
              className={"compoundQueryType" + index}
            />
          </div>
        )}
        <div style={{ width: index > 0 ? "92%" : "100%" }}>
          <SelectField
            name={fieldProps("fieldName", index).name}
            options={queryRowOptions as any}
            onChange={(value, formik) =>
              onSelectionChange(value, formik, index)
            }
            className={`flex-grow-1 me-2 ps-0`}
            removeLabel={true}
          />
        </div>
      </div>
      <div className="col-md-6">
        <div className="d-flex">
          {visibility.text && (
            <TextField
              name={fieldProps("matchValue", index).name}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {visibility.date && (
            <DateField
              name={fieldProps("date", index).name}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {visibility.text && (
            <SelectField
              name={fieldProps("matchType", index).name}
              options={queryRowMatchOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {visibility.boolean && (
            <SelectField
              name={fieldProps("boolean", index).name}
              options={queryRowBooleanOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {visibility.number && (
            <NumberField
              name={fieldProps("number", index).name}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}

          {index === 0 ? (
            <FaPlus
              onClick={addRow as any}
              size="2em"
              style={{ cursor: "pointer" }}
              name={fieldProps("addRow", index).name}
            />
          ) : (
            <FaMinus
              onClick={() => removeRow?.(index)}
              size="2em"
              style={{ cursor: "pointer" }}
              name={fieldProps("removeRow", index).name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
