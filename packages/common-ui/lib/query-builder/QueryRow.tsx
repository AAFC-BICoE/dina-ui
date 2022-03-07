import { useEffect, useState } from "react";
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
  isResetRef?: React.MutableRefObject<boolean>;
  formik?: FormikContextType<any>;
  isFromLoadedRef?: React.MutableRefObject<boolean>;
}

export interface ESIndexMapping {
  value: string;
  label: string;
  type: string;
  path: string;
  parentPath?: string;
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
  const {
    esIndexMapping,
    index,
    addRow,
    removeRow,
    name,
    isResetRef,
    isFromLoadedRef
  } = queryRowProps;
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
    // When selection is changed, the reset filter or loaded from saved search query should be reset
    if (isResetRef) isResetRef.current = false;
    if (isFromLoadedRef) isFromLoadedRef.current = false;
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
          {(isResetRef?.current
            ? esIndexMapping?.[0]?.type === "text"
            : visibility.text) && (
            <TextField
              name={fieldProps("matchValue", index).name}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {(isResetRef?.current
            ? esIndexMapping?.[0]?.type === "date"
            : visibility.date) && (
            <DateField
              name={fieldProps("date", index).name}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {(isResetRef?.current
            ? esIndexMapping?.[0]?.type === "text"
            : visibility.text) && (
            <SelectField
              name={fieldProps("matchType", index).name}
              options={queryRowMatchOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {(isResetRef?.current
            ? esIndexMapping?.[0]?.type === "boolean"
            : visibility.boolean) && (
            <SelectField
              name={fieldProps("boolean", index).name}
              options={queryRowBooleanOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {(isResetRef?.current
            ? esIndexMapping?.[0]?.type === "long" ||
              esIndexMapping?.[0]?.type === "short" ||
              esIndexMapping?.[0]?.type === "integer" ||
              esIndexMapping?.[0]?.type === "byte" ||
              esIndexMapping?.[0]?.type === "double" ||
              esIndexMapping?.[0]?.type === "float" ||
              esIndexMapping?.[0]?.type === "half_float" ||
              esIndexMapping?.[0]?.type === "scaled_float" ||
              esIndexMapping?.[0]?.type === "unsiged_long"
            : visibility.number) && (
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
