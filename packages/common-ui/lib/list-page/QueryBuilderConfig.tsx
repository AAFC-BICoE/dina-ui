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
import QueryRowBooleanSearch, {
  transformBooleanSearchToDSL
} from "./query-row-search-options/QueryRowBooleanSearch";
import QueryRowDateSearch, {
  transformDateSearchToDSL
} from "./query-row-search-options/QueryRowDateSearch";
import QueryRowNumberSearch, {
  transformNumberSearchToDSL
} from "./query-row-search-options/QueryRowNumberSearch";
import QueryRowTextSearch, {
  transformTextSearchToDSL
} from "./query-row-search-options/QueryRowTextSearch";
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

/**
 * Helper function to get the index settings for a field path.
 *
 * The index settings has more information than what can be stored in the list, especially for
 * nested fields.
 */
export function fieldPathToIndexSettings(
  fieldName: string,
  indexMap: ESIndexMapping[]
): ESIndexMapping | undefined {
  return indexMap.find((indexSettings) => indexSettings.value === fieldName);
}

/**
 * Converts elastic search types into query builder types.
 * @param type The type from elastic search from the index.
 * @param distinctTerm Boolean to indicate if the field contains a distinct term.
 * @returns Query builder specific type.
 */
function getQueryBuilderTypeFromIndexType(
  type: string,
  distinctTerm: boolean
): string {
  // If the field is a distinct term, then it's an autocomplete field.
  if (distinctTerm) {
    return "autoComplete";
  }

  switch (type) {
    // These fields are directly supported.
    case "text":
    case "date":
    case "boolean":
      return type;

    // Elastic search contains many different number fields.
    case "long":
    case "short":
    case "integer":
    case "byte":
    case "double":
    case "float":
    case "half_float":
    case "scaled_float":
    case "unsigned":
      return "number";
  }

  // Unsupported type, this will cause an error with the query builder.
  return "unsupported";
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
    exactMatch: {
      label: "Exact match",
      cardinality: 1
    },
    partialMatch: {
      label: "Partial match",
      cardinality: 1
    },
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
      ...BasicConfig.widgets.text,
      type: "text",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowTextSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) =>
        transformTextSearchToDSL({
          fieldPath: field,
          operation: op,
          value: val,
          queryType,
          fieldInfo: fieldPathToIndexSettings(field, indexMap)
        })
    },
    autoComplete: {
      ...BasicConfig.widgets.text,
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
      elasticSearchFormatValue: (queryType, val, op, field, _config) =>
        transformTextSearchToDSL({
          fieldPath: field,
          operation: op,
          value: val,
          queryType,
          fieldInfo: fieldPathToIndexSettings(field, indexMap)
        })
    },
    date: {
      ...BasicConfig.widgets.date,
      type: "date",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowDateSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) =>
        transformDateSearchToDSL({
          fieldPath: field,
          operation: op,
          value: val,
          queryType,
          fieldInfo: fieldPathToIndexSettings(field, indexMap)
        })
    },
    number: {
      ...BasicConfig.widgets.text,
      type: "number",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowNumberSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) =>
        transformNumberSearchToDSL({
          fieldPath: field,
          operation: op,
          value: val,
          queryType,
          fieldInfo: fieldPathToIndexSettings(field, indexMap)
        })
    },
    boolean: {
      ...BasicConfig.widgets.text,
      type: "boolean",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowBooleanSearch
          matchType={factoryProps?.operator}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) =>
        transformBooleanSearchToDSL({
          fieldPath: field,
          operation: op,
          value: val,
          queryType,
          fieldInfo: fieldPathToIndexSettings(field, indexMap)
        })
    }
  };

  const types: Types = {
    text: {
      valueSources: ["value"],
      defaultOperator: "exactMatch",
      widgets: {
        text: {
          operators: [
            "exactMatch",
            "partialMatch",
            "notEquals",
            "empty",
            "notEmpty"
          ]
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

  const fields: Fields = Object.assign(
    {},
    ...indexMap?.map((indexItem: ESIndexMapping) => {
      const field = {};
      field[indexItem.value] = {
        label: indexItem.label,
        type: getQueryBuilderTypeFromIndexType(
          indexItem.type,
          indexItem.distinctTerm
        ),
        valueSources: ["value"]
      };

      return field;
    })
  );

  return {
    conjunctions,
    operators,
    widgets,
    types,
    settings,
    fields
  };
}
