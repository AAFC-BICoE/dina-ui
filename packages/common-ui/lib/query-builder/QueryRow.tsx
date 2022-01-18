import { useState } from "react";
import {
  DateField,
  NumberField,
  QueryLogicSwitchField,
  SelectField,
  TextField
} from "..";
import { FaPlus, FaMinus } from "react-icons/fa";
interface QueryRowProps {
  esIndexMapping: ESIndexMapping[];
  index: number;
  addRow?: () => void;
  removeRow?: (index) => void;
}

export interface ESIndexMapping {
  value: string;
  label: string;
  type: string;
}

interface QueryRowExportProps {
  fieldName: string;
  queryType: string;
  matchValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  matchType?: string;
  compoundQueryType?: string;
  number?: string;
  date?: string;
}

type queryRowMatchType = "PARTIAL_MATCH" | "EXACT_MATCH" | "BLANK_FIELD";
type queryRowBooleanType = "TRUE" | "FALSE";

const queryRowMatchOptions = [
  { label: "PARTIAL_MATCH", value: "PARTIAL_MATCH" },
  { label: "EXACT_MATCH", value: "EXACT_MATCH" },
  { label: "BLANK_FIELD", value: "BLANK_FIELD" }
];

const queryRowBooleanOptions = [
  { label: "TRUE", value: "TRUE" },
  { label: "FALSE", value: "FALSE" }
];

export function QueryRow(queryRowProps: QueryRowProps) {
  const { esIndexMapping, index, addRow, removeRow } = queryRowProps;
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

  return (
    <div className="d-flex">
      {index > 0 && (
        <QueryLogicSwitchField name="compoundQueryType" removeLabel={true} />
      )}
      <SelectField
        name={"fieldName"}
        options={queryRowOptions}
        onChange={onSelectionChange}
        className="flex-grow-1 me-2"
        removeLabel={true}
      />
      {visibility.text && (
        <TextField name="matchValue" className="me-2" removeLabel={true} />
      )}
      {/* <TextField name="start"></TextField>
    <TextField name="end"></TextField>
    <DateField name="startDate"></DateField>
    <DateField name="endDate"></DateField> */}
      {visibility.date && (
        <DateField name="date" className="me-2" removeLabel={true} />
      )}
      {visibility.text && (
        <SelectField
          name="matchType"
          options={queryRowMatchOptions}
          className="me-2"
          removeLabel={true}
        />
      )}
      {visibility.boolean && (
        <SelectField
          name="boolean"
          options={queryRowBooleanOptions}
          className="me-2"
          removeLabel={true}
        />
      )}
      {visibility.number && (
        <NumberField name="number" className="me-2" removeLabel={true} />
      )}

      {index === 0 ? (
        <FaPlus
          onClick={addRow as any}
          size="2em"
          style={{ cursor: "pointer" }}
        />
      ) : (
        <FaMinus
          onClick={removeRow as any}
          size="2em"
          style={{ cursor: "pointer" }}
        />
      )}
    </div>
  );
}
