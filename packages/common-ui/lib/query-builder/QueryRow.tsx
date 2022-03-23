import { useEffect, useMemo, useState } from "react";
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
}

interface QueryRowDataProps {
  fieldName: string;
  type: string;
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
  const { esIndexMapping, index, addRow, removeRow, name } = queryRowProps;

  // Determine the name of the query row based on the current formik values.
  const [queryRowData, setQueryRowData] = useState<QueryRowDataProps>({
    fieldName: (formikProps.values as any)?.queryRows?.[index].fieldName,
    type: ""
  });

  const initState = {
    matchValue: null,
    matchType: "match",
    date: moment().format("YYYY-MM-DD"),
    boolean: "true",
    number: null
  };

  // Find the specific index mapping settings for this query row. Only updates when the fieldName changes.
  const attributeSettings = useMemo(
    () => esIndexMapping.find((attribute) => attribute.value === queryRowData.fieldName),
    [queryRowData]
  );

  useEffect(() => {
    formikProps.setFieldValue(`${name}[${index}]`, {
      ...initState,
      ...queryRowData
    });
  }, [queryRowData])

  // Depending on the type, it changes what fields need to be displayed.
  const typeVisibility = {
    isText: attributeSettings?.type === "text",
    isBoolean: attributeSettings?.type === "boolean",
    isNumber: attributeSettings?.type === "long" || 
              attributeSettings?.type === "short" || 
              attributeSettings?.type === "integer" || 
              attributeSettings?.type === "byte" || 
              attributeSettings?.type === "double" || 
              attributeSettings?.type === "float" || 
              attributeSettings?.type === "half_float" || 
              attributeSettings?.type === "scaled_float" || 
              attributeSettings?.type === "unsigned",
    isDate: attributeSettings?.type === "date",
  }

  function onSelectionChange(value) {
    const dataFromIndexMapping = esIndexMapping.find((attribute) => attribute.value === value);

    setQueryRowData({
      fieldName: value,
      type: dataFromIndexMapping?.type ?? "text",
    });
  }

  const simpleRowOptions = esIndexMapping
    ?.filter(prop => !prop.parentPath)
    ?.map(prop => ({
      label: prop.label,
      value: prop.value
    }));

  let nestedGroupLabel = "Nested Group";

  const nestedRowOptions = esIndexMapping
    ?.filter(prop => !!prop.parentPath)
    ?.map(prop => {
      nestedGroupLabel = prop.parentName as string;
      return {
        label: prop.label,
        value: prop.value
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
    return `${name}[${idx}].${fldName}`
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
          {typeVisibility.isText && (
            <TextField
              name={fieldProps("matchValue", index)}
              className="me-1 flex-fill"
              removeLabel={true}
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

          {index === 0 ? (
            <FaPlus
              onClick={addRow as any}
              size="2em"
              style={{ cursor: "pointer" }}
              name={fieldProps("addRow", index)}
            />
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
