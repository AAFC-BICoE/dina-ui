import { useState } from "react";
import {
  DateField,
  NumberField,
  QueryLogicSwitchField,
  SelectField,
  TextField
} from "..";
import { FaPlus, FaMinus } from "react-icons/fa";
export interface QueryRowProps {
  esIndexMapping: ESIndexMapping[];
  index: number;
  addRow?: () => void;
  removeRow?: (index) => void;
  name: string;
}

export interface ESIndexMapping {
  value: string;
  label: string;
  type: string;
}

export interface QueryRowExportProps {
  fieldName: string;
  matchValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  matchType?: string;
  compoundQueryType?: string;
  number?: string;
  date?: string;
  boolean?: string | boolean;
}

type queryRowMatchType = "PARTIAL_MATCH" | "EXACT_MATCH" | "BLANK_FIELD";
type queryRowBooleanType = "TRUE" | "FALSE";

const queryRowMatchOptions = [
  { label: "PARTIAL_MATCH", value: "match" },
  { label: "EXACT_MATCH", value: "term" }
];

const queryRowBooleanOptions = [
  { label: "TRUE", value: "true" },
  { label: "FALSE", value: "false" }
];

export function QueryRow(queryRowProps: QueryRowProps) {
  const { esIndexMapping, index, addRow, removeRow, name } = queryRowProps;
  const initVisibility = {
    text: false,
    date: false,
    boolean: false,
    number: false,
    numberRange: false,
    dateRange: false
  };

  const [visibility, setVisibility] = useState(initVisibility);

  function onSelectionChange(value, _) {
    const type = value.substring(value.indexOf("(") + 1, value.indexOf(")"));
    switch (type) {
      case "text":
        return setVisibility({ ...initVisibility, text: true });

      case "date":
        return setVisibility({ ...initVisibility, date: true });

      case "boolean":
        return setVisibility({ ...initVisibility, boolean: true });

      case "long":
        return setVisibility({ ...initVisibility, number: true });
    }
  }

  const queryRowOptions = esIndexMapping?.map(prop => ({
    label: prop.label,
    value: prop.value + "(" + prop.type + ")"
  }));

  function fieldProps(fieldName: string, idx: number) {
    return {
      name: `${name}[${idx}].${fieldName}`
    };
  }

  return (
    <div className="d-flex">
      {index > 0 && (
        <QueryLogicSwitchField
          name={fieldProps("compoundQueryType", index).name}
          removeLabel={true}
          className={"compoundQueryType" + index}
        />
      )}
      <SelectField
        name={fieldProps("fieldName", index).name}
        options={queryRowOptions}
        onChange={onSelectionChange}
        className={`flex-grow-1 me-2 `}
        removeLabel={true}
      />
      {visibility.text && (
        <TextField
          name={fieldProps("matchValue", index).name}
          className="me-2"
          removeLabel={true}
        />
      )}
      {/* <TextField name="start"></TextField>
    <TextField name="end"></TextField>
    <DateField name="startDate"></DateField>
    <DateField name="endDate"></DateField> */}
      {visibility.date && (
        <DateField
          name={fieldProps("date", index).name}
          className="me-2"
          removeLabel={true}
        />
      )}
      {visibility.text && (
        <SelectField
          name={fieldProps("matchType", index).name}
          options={queryRowMatchOptions}
          className="me-2"
          removeLabel={true}
        />
      )}
      {visibility.boolean && (
        <SelectField
          name={fieldProps("boolean", index).name}
          options={queryRowBooleanOptions}
          className="me-2"
          removeLabel={true}
        />
      )}
      {visibility.number && (
        <NumberField
          name={fieldProps("number", index).name}
          className="me-2"
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
          onClick={removeRow as any}
          size="2em"
          style={{ cursor: "pointer" }}
          name={fieldProps("removeRow", index).name}
        />
      )}
    </div>
  );
}
