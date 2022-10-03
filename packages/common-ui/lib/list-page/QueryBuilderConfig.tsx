import {
  BasicConfig,
  Config,
  Conjunctions,
  Fields,
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
  const conjunctions: Conjunctions = {
    ...BasicConfig.conjunctions
  };

  const operators: Operators = {
    equals: {
      label: "Equals"
    },
    notEquals: {
      label: "Not equals"
    },
    empty: {
      label: "Empty"
    },
    notEmpty: {
      label: "Not empty"
    },
    greaterThan: {
      label: "Greater than"
    },
    greaterThanOrEqualTo: {
      label: "Greater than or equal to"
    },
    lessThan: {
      label: "Less than"
    },
    lessThanOrEqualTo: {
      label: "Less than or equal to"
    },
    contains: {
      label: "Contains"
    }
  };

  const widgets: Widgets = {
    ...BasicConfig.widgets,
    text: {
      ...BasicConfig.widgets.text,
      factory: (factoryProps) => (
        <QueryRowTextSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      )
    },
    autoComplete: {
      ...BasicConfig.widgets.text,
      factory: (factoryProps) => (
        <QueryRowAutoSuggestionTextSearch
          currentFieldName={factoryProps?.field}
          matchType={factoryProps?.operator}
          indexName={indexName}
          indexMap={indexMap}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      )
    },
    date: {
      ...BasicConfig.widgets.date,
      factory: (factoryProps) => (
        <QueryRowDateSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      )
    }
  };

  const types: Types = {
    text: {
      defaultOperator: "equals",
      mainWidget: "text",
      widgets: {
        text: {
          operators: ["equals", "notEquals", "empty", "notEmpty"]
        }
      }
    },
    autoComplete: {
      defaultOperator: "equals",
      widgets: {
        autoComplete: {
          operators: ["equals", "notEquals", "empty", "notEmpty"]
        }
      }
    },
    date: {
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
    clearValueOnChangeOp: false
  };

  let fields: Fields = {};
  indexMap?.forEach((indexItem: ESIndexMapping) => {
    fields = {
      ...fields,
      [indexItem.path + "." + indexItem.label]: {
        label: indexItem.label,
        type: indexItem.distinctTerm ? "autoComplete" : indexItem.type
      }
    } as Fields;
  });

  return {
    conjunctions,
    operators,
    widgets,
    types,
    settings,
    fields
  };
}
