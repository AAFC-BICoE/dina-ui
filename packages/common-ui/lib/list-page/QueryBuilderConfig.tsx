import {
  BasicConfig,
  BasicFuncs,
  Config,
  Conjunctions,
  Field,
  Fields,
  Funcs,
  Operators,
  RenderSettings,
  Settings,
  Types,
  Widgets
} from "react-awesome-query-builder";
import { Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import QueryRowAutoSuggestionTextSearch from "./query-row-search-options/QueryRowAutoSuggestionSearch";
import QueryRowDateSearch from "./query-row-search-options/QueryRowDateSearch";
import QueryRowTextSearch from "./query-row-search-options/QueryRowTextSearch";
import { QueryConjunctionSwitch } from "./QueryConjunctionSwitch";
import { QueryFieldSelector } from "./QueryFieldSelector";
import { QueryOperatorSelector } from "./QueryOperatorSelector";
import { QueryTextSwitch } from "./QueryTextSwitch";
import { ESIndexMapping } from "./types";

interface QueryBuilderConfigProps {
  // The index map is used for generating the field list.
  indexMap: ESIndexMapping[];

  // The index name currently being used.
  indexName: string;
}

export function queryBuilderConfig({
  indexMap,
  indexName
}: QueryBuilderConfigProps): Config {
  // If the index map doesn't exist, then there is no point of loading the config yet.
  if (!indexMap) {
    return {} as any;
  }

  const conjunctions: Conjunctions = {
    ...BasicConfig.conjunctions
  };

  const operators: Operators = {
    equals: {
      label: "Equals",
      cardinality: 1
    },
    notEquals: {
      label: "Not equals",
      cardinality: 1
    },
    empty: {
      label: "Empty",
      cardinality: 0
    },
    notEmpty: {
      label: "Not empty",
      cardinality: 0
    },
    greaterThan: {
      label: "Greater than",
      cardinality: 1
    },
    greaterThanOrEqualTo: {
      label: "Greater than or equal to",
      cardinality: 1
    },
    lessThan: {
      label: "Less than",
      cardinality: 1
    },
    lessThanOrEqualTo: {
      label: "Less than or equal to",
      cardinality: 1
    },
    contains: {
      label: "Contains",
      cardinality: 1
    }
  };

  const widgets: Widgets = {
    ...BasicConfig.widgets,
    text: {
      type: "text",
      valueSrc: "func",
      factory: (factoryProps) => (
        <QueryRowTextSearch
          matchType={factoryProps?.operator}
          currentValue={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      formatValue: (val, _fieldDef, _wgtDef, _isForDisplay) =>
        JSON.stringify(val)
    },
    autoComplete: {
      type: "autoComplete",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowAutoSuggestionTextSearch
          currentFieldName={factoryProps?.field}
          matchType={factoryProps?.operator}
          indexName={indexName}
          indexMap={indexMap}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      formatValue: (val, _fieldDef, _wgtDef, _isForDisplay) =>
        JSON.stringify(val)
    },
    date: {
      type: "date",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowDateSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      formatValue: (val, _fieldDef, _wgtDef, _isForDisplay) =>
        JSON.stringify(val)
    }
  };

  const types: Types = {
    text: {
      valueSources: ["func"],
      defaultOperator: "equals",
      widgets: {
        text: {
          operators: ["equals", "notEquals", "empty", "notEmpty"]
        }
      }
    },
    autoComplete: {
      valueSources: ["value"],
      defaultOperator: "equals",
      widgets: {
        autoComplete: {
          operators: ["equals", "notEquals", "empty", "notEmpty"]
        }
      }
    },
    date: {
      valueSources: ["value"],
      defaultOperator: "equals",
      widgets: {
        date: {
          /**
           * The match options when a date search is being performed.
           *
           * Equals is for an exact match. Example: "2020-01-01", then only on that specific date.
           * Contains is for a partial match. Example: "2020", then on any date that is in 2020 will match.
           * Empty and Not Empty can be used if the date value is not mandatory.
           */
          operators: [
            "equals",
            "notEquals",
            "contains",
            "greaterThan",
            "greaterThanOrEquals",
            "lessThan",
            "lessThanOrEquals",
            "empty",
            "notEmpty"
          ]
        }
      }
    },
    number: {
      valueSources: ["value"],
      defaultOperator: "equals",
      widgets: {
        number: {
          operators: [
            "equals",
            "notEquals",
            "greaterThan",
            "greaterThanOrEquals",
            "lessThan",
            "lessThanOrEquals",
            "empty",
            "notEmpty"
          ]
        }
      }
    },
    boolean: {
      valueSources: ["value"],
      defaultOperator: "equals",
      widgets: {
        boolean: {
          operators: ["equals", "empty", "notEmpty"]
        }
      }
    }
  };

  const renderSettings: RenderSettings = {
    renderButton: (buttonProps) => {
      if (buttonProps) {
        switch (buttonProps?.type) {
          case "addRule":
          case "addGroup":
            return (
              <Button onClick={buttonProps?.onClick} className="ms-1">
                {buttonProps.label}
              </Button>
            );
          case "delGroup":
          case "delRule":
          case "delRuleGroup":
            return (
              <Button
                onClick={buttonProps?.onClick}
                className="ms-1"
                variant="danger"
              >
                <FaTrash />
              </Button>
            );
        }
      }

      return (
        <Button onClick={buttonProps?.onClick} className="ms-1">
          {buttonProps?.label}
        </Button>
      );
    },
    renderField: (fieldDropdownProps) => (
      <QueryFieldSelector
        indexMap={indexMap}
        currentField={fieldDropdownProps?.selectedLabel ?? ""}
        setField={fieldDropdownProps?.setField}
      />
    ),
    renderOperator: (operatorDropdownProps) => (
      <QueryOperatorSelector
        options={operatorDropdownProps?.items}
        selectedOperator={operatorDropdownProps?.selectedKey ?? ""}
        setOperator={operatorDropdownProps?.setField}
      />
    ),
    renderFunc: (funcProps) => (
      <QueryTextSwitch
        currentTextOption={funcProps?.selectedKey ?? ""}
        setTextOption={funcProps?.setField}
      />
    ),
    renderConjs: (conjunctionProps) => (
      <QueryConjunctionSwitch
        currentConjunction={conjunctionProps?.selectedConjunction}
        setConjunction={conjunctionProps?.setConjunction}
      />
    )
  };

  const settings: Settings = {
    ...BasicConfig.settings,
    ...renderSettings,
    showNot: false,
    canRegroup: true,
    canReorder: true,
    clearValueOnChangeField: false,
    clearValueOnChangeOp: false,
    valueSourcesInfo: {
      value: {
        label: "Value"
      },
      func: {
        label: "Function",
        widget: "func"
      }
    }
  };

  const fields: Fields = Object.assign(
    {},
    ...indexMap?.map((indexItem: ESIndexMapping) => {
      const field = {};
      const type = indexItem.distinctTerm ? "autoComplete" : indexItem.type;

      field[indexItem.value] = {
        label: indexItem.label,
        type,
        valueSources: type === "text" ? ["func"] : ["value"]
      };

      return field;
    })
  );

  const funcs: Funcs = {
    partial: {
      label: "partial",
      returnType: "text",
      args: {
        str: {
          type: "text",
          valueSources: ["value"]
        }
      }
    },
    exact: {
      label: "exact",
      returnType: "text",
      args: {
        str: {
          type: "text",
          valueSources: ["value"]
        }
      }
    }
  };

  return {
    conjunctions,
    operators,
    widgets,
    types,
    settings,
    fields,
    funcs
  };
}
