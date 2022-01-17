import { useState } from "react";
import {
  DateField,
  NumberField,
  QueryLogicSwitchField,
  SelectField,
  TextField
} from "..";

interface QueryRowProps {
  esIndexMapping: ESIndexMapping[];
}

export interface ESIndexMapping {
  value: string;
  label: string;
  type: string;
}

interface QueryRowExportProps {
  fieldName: string;
  queryType: string;
  fieldValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  queryMatchType?: string;
  compoundQueryType?: string;
}

export function QueryRow({ queryRowProps }) {
  const [visibility, setVisibility] = useState({
    text: false,
    date: false,
    boolean: false,
    number: false,
    numberRange: false,
    dateRange: false
  });

  function onSelectionChange(value, _) {
    const type = value.substring(value.indexOf("(") + 1, value.indexOf(")"));
    switch (type) {
      case "text":
        return setVisibility({
          text: true,
          date: false,
          numberRange: false,
          dateRange: false,
          boolean: false,
          number: false
        });

      case "date":
        return setVisibility({
          text: false,
          date: true,
          numberRange: false,
          dateRange: false,
          boolean: false,
          number: false
        });

      case "boolean":
        return setVisibility({
          text: false,
          date: false,
          numberRange: false,
          dateRange: false,
          boolean: true,
          number: false
        });

      case "long":
        return setVisibility({
          text: false,
          date: false,
          numberRange: false,
          dateRange: false,
          boolean: false,
          number: true
        });
    }
  }

  const queryRowOptions = queryRowProps?.map(prop => ({
    label: prop.label,
    value: prop.value + "(" + prop.type + ")"
  }));

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

  return (
    <div className="d-flex">
      <QueryLogicSwitchField name="queryLogicSwitch" removeLabel={true} />
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
    </div>
  );
}
