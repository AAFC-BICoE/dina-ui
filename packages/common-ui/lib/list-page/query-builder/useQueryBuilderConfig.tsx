import { useState, useEffect } from "react";
import {
  BasicConfig,
  Config,
  Conjunctions,
  Fields,
  LocaleSettings,
  Operators,
  RenderSettings,
  Settings,
  Types,
  Widgets
} from "react-awesome-query-builder";
import { Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { useIntl } from "react-intl";
import { ESIndexMapping } from "../types";
import { useIndexMapping } from "../useIndexMapping";
import { QueryConjunctionSwitch } from "./query-builder-core-components/QueryConjunctionSwitch";
import { QueryFieldSelector } from "./query-builder-core-components/QueryFieldSelector";
import { QueryOperatorSelector } from "./query-builder-core-components/QueryOperatorSelector";
import QueryBuilderAutoSuggestionTextSearch from "./query-builder-value-types/QueryBuilderAutoSuggestionSearch";
import QueryBuilderBooleanSearch, {
  transformBooleanSearchToDSL
} from "./query-builder-value-types/QueryBuilderBooleanSearch";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL,
  validateDate
} from "./query-builder-value-types/QueryBuilderDateSearch";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL
} from "./query-builder-value-types/QueryBuilderNumberSearch";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "./query-builder-value-types/QueryBuilderTextSearch";

/**
 * Helper function to get the index settings for a field path.
 *
 * The index settings has more information than what can be stored in the list, especially for
 * nested fields.
 */
function fieldPathToIndexSettings(
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

/**
 * Depending on the field type, a different validation will need to be performed.
 *
 * @param value string value to validate against.
 * @param type the type of the field, to determine how to validate the value.
 * @param formatMessage internationalization support.
 * @returns null if no validation errors or string with the error message.
 */
function validateField(value: string, type: string, formatMessage: any) {
  switch (type) {
    case "date":
      return validateDate(value, formatMessage);
    default:
      return true;
  }
}

/**
 * Custom hook for generating the query builder hook. It should only be generated once.
 */
export function useQueryBuilderConfig(indexName: string) {
  // Load index map using the index name.
  const { indexMap } = useIndexMapping(indexName);
  const { formatMessage } = useIntl();

  const [queryBuilderConfig, setQueryBuilderConfig] = useState<Config>();

  // When the index map has been provided (or changed) it can be generated.
  useEffect(() => {
    if (!indexMap) return;

    setQueryBuilderConfig(
      generateBuilderConfig(indexMap, indexName, formatMessage)
    );
  }, [indexMap]);

  return { queryBuilderConfig };
}

/**
 * Create the query builder configure using the index map and index name.
 *
 * @param indexMap The index map is used for generating the field list.
 * @param indexName The index name currently being used.
 * @returns Query Builder configuration.
 */
function generateBuilderConfig(
  indexMap: ESIndexMapping[],
  indexName: string,
  formatMessage: any
): Config {
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
        <QueryBuilderTextSearch
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
        <QueryBuilderAutoSuggestionTextSearch
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
        <QueryBuilderDateSearch
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
        <QueryBuilderNumberSearch
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
        <QueryBuilderBooleanSearch
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

  const localeSettings: LocaleSettings = {
    addRuleLabel: "Add condition",
    addGroupLabel: "Add group"
  };

  const settings: Settings = {
    ...BasicConfig.settings,
    ...renderSettings,
    ...localeSettings,
    showNot: false,
    canRegroup: true,
    canReorder: true,
    clearValueOnChangeField: false,
    clearValueOnChangeOp: false,
    showErrorMessage: true
  };

  const fields: Fields = Object.assign(
    {},
    ...indexMap?.map((indexItem: ESIndexMapping) => {
      const field = {};
      const type = getQueryBuilderTypeFromIndexType(
        indexItem.type,
        indexItem.distinctTerm
      );
      field[indexItem.value] = {
        label: indexItem.label,
        type,
        valueSources: ["value"],
        fieldSettings: {
          validateValue: (value, _fieldSettings) =>
            validateField(value, type, formatMessage)
        }
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
