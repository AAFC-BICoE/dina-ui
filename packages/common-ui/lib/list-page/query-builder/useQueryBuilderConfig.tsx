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
} from "@react-awesome-query-builder/ui";
import { Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

import { useIntl } from "react-intl";
import { DynamicFieldsMappingConfig, ESIndexMapping } from "../types";
import { useIndexMapping } from "../useIndexMapping";
import { QueryConjunctionSwitch } from "./query-builder-core-components/QueryConjunctionSwitch";
import { QueryFieldSelector } from "./query-builder-core-components/QueryFieldSelector";
import { QueryOperatorSelector } from "./query-builder-core-components/QueryOperatorSelector";
import { QueryBuilderAutoSuggestionTextSearchMemo } from "./query-builder-value-types/QueryBuilderAutoSuggestionSearch";
import QueryBuilderBooleanSearch, {
  transformBooleanSearchToDSL
} from "./query-builder-value-types/QueryBuilderBooleanSearch";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL
} from "./query-builder-value-types/QueryBuilderDateSearch";
import QueryRowFieldExtensionSearch, {
  transformFieldExtensionToDSL
} from "./query-builder-value-types/QueryBuilderFieldExtensionSearch";
import QueryRowManagedAttributeSearch, {
  transformManagedAttributeToDSL
} from "./query-builder-value-types/QueryBuilderManagedAttributeSearch";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL
} from "./query-builder-value-types/QueryBuilderNumberSearch";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "./query-builder-value-types/QueryBuilderTextSearch";
import { transformUUIDSearchToDSL } from "./query-builder-value-types/QueryBuilderUUIDSearch";
import QueryRowGlobalSearchSearch, {
  transformGlobalSearchToDSL
} from "./query-builder-value-types/QueryBuilderGlobalSearch";
import QueryRowRelationshipPresenceSearch, {
  transformRelationshipPresenceToDSL
} from "./query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import QueryRowIdentifierSearch, {
  transformIdentifierToDSL
} from "./query-builder-value-types/QueryBuilderIdentifierSearch";
import QueryBuilderVocabularySearch from "./query-builder-value-types/QueryBuilderVocabularySearch";
import QueryRowClassificationSearch, {
  transformClassificationToDSL
} from "./query-builder-value-types/QueryBuilderClassificationSearch";
import { MdPlaylistAdd } from "react-icons/md";
import { LuParentheses } from "react-icons/lu";

/**
 * Helper function to get the index settings for a field value.
 *
 * The index settings has more information than what can be stored in the list, especially for
 * nested fields.
 */
export function fieldValueToIndexSettings(
  fieldPath: string,
  indexMap: ESIndexMapping[]
): ESIndexMapping | undefined {
  return indexMap.find((indexSettings) => indexSettings.value === fieldPath);
}

/**
 * Helper function to get the field path from the index settings.
 *
 * @param indexSettings Index settings for the field.
 */
function indexSettingsToFieldPath(indexSettings?: ESIndexMapping): string {
  if (!indexSettings) return "";

  return indexSettings.parentName
    ? indexSettings.parentPath + ".attributes." + indexSettings.label
    : "data.attributes." + indexSettings.label;
}

/**
 * Converts elastic search types into query builder types.
 * @param type The type from elastic search from the index.
 * @param distinctTerm Boolean to indicate if the field contains a distinct term.
 * @param isVocabulary Boolean to indicate if the field is a vocabulary.
 * @returns Query builder specific type.
 */
function getQueryBuilderTypeFromIndexType(
  type: string,
  distinctTerm: boolean,
  isVocabulary: boolean
): string {
  // If the field is a vocabulary, then it's a vocabulary field.
  if (isVocabulary) {
    return "vocabulary";
  }

  // If the field is a distinct term, then it's an autocomplete field.
  if (distinctTerm) {
    return "autoComplete";
  }

  switch (type) {
    // These fields are directly supported.
    case "text":
    case "date":
    case "boolean":
    case "managedAttribute":
    case "fieldExtension":
    case "identifier":
    case "relationshipPresence":
    case "classification":
      return type;

    // If it's stored directly as a keyword, it's considered a text field.
    case "keyword":
      return "text";

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

// Unique fieldname identifier for global search.
export const GLOBAL_SEARCH_FIELDNAME = "_globalSearch";

// Unique fieldname identifier for relationship presence.
export const RELATIONSHIP_PRESENCE_FIELDNAME = "_relationshipPresence";

export interface CustomViewField {
  /**
   * The field name used in the Custom View.
   */
  fieldName: string;

  /**
   * The type of the Custom View item. Usually this is a UUID but any type can be used.
   */
  type: string;
}

export interface UseQueryBuilderConfigProps {
  indexName: string;

  /**
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;

  /**
   * This will add an option to the QueryBuilder to allow users to check if a relationship exists.
   */
  enableRelationshipPresence?: boolean;

  customViewFields?: CustomViewField[];

  /**
   * IDs of the columns that should not be displayed in the Query Builder field selector.
   *
   * Uses the startsWith match so you can define the full path or partial paths.
   *
   * Used for the column selector.
   */
  nonSearchableColumns?: string[];
}

/**
 * Custom hook for generating the query builder hook. It should only be generated once.
 */
export function useQueryBuilderConfig({
  indexName,
  dynamicFieldMapping,
  enableRelationshipPresence,
  customViewFields,
  nonSearchableColumns
}: UseQueryBuilderConfigProps) {
  // Load index map using the index name.
  const { indexMap } = useIndexMapping({
    indexName,
    dynamicFieldMapping,
    enableRelationshipPresence
  });
  const { formatMessage, locale } = useIntl();

  const [queryBuilderConfig, setQueryBuilderConfig] = useState<Config>();

  // When the index map has been provided (or changed) it can be generated.
  useEffect(() => {
    if (!indexMap) return;

    setQueryBuilderConfig(
      generateBuilderConfig(
        indexMap,
        indexName,
        formatMessage,
        customViewFields,
        enableRelationshipPresence,
        nonSearchableColumns
      )
    );
  }, [indexMap, customViewFields, locale]);

  return { queryBuilderConfig, indexMap };
}

/**
 * Create the query builder configure using the index map and index name.
 *
 * @param indexMap The index map is used for generating the field list.
 * @param indexName The index name currently being used.
 * @returns Query Builder configuration.
 */
export function generateBuilderConfig(
  indexMap: ESIndexMapping[],
  indexName: string,
  formatMessage: any,
  customViewFields?: CustomViewField[],
  enableRelationshipPresence?: boolean,
  nonSearchableColumns?: string[]
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
      label: formatMessage({ id: "queryBuilder_operator_exactMatch" }),
      cardinality: 1
    },
    wildcard: {
      // Displayed as "Contains"
      label: formatMessage({ id: "queryBuilder_operator_wildcard" }),
      cardinality: 1
    },
    in: {
      label: formatMessage({ id: "queryBuilder_operator_in" }),
      cardinality: 1
    },
    notIn: {
      label: formatMessage({ id: "queryBuilder_operator_notIn" }),
      cardinality: 1
    },
    startsWith: {
      label: formatMessage({ id: "queryBuilder_operator_startsWith" }),
      cardinality: 1
    },
    containsText: {
      // Displayed as "Contains", this is an optimized version of the wildcard.
      label: formatMessage({ id: "queryBuilder_operator_containsDate" }),
      cardinality: 1
    },
    endsWith: {
      label: formatMessage({ id: "queryBuilder_operator_endsWith" }),
      cardinality: 1
    },
    equals: {
      label: formatMessage({ id: "queryBuilder_operator_equals" }),
      cardinality: 1
    },
    notEquals: {
      label: formatMessage({ id: "queryBuilder_operator_notEquals" }),
      cardinality: 1
    },
    empty: {
      label: formatMessage({ id: "queryBuilder_operator_empty" }),
      cardinality: 0
    },
    notEmpty: {
      label: formatMessage({ id: "queryBuilder_operator_notEmpty" }),
      cardinality: 0
    },
    greaterThan: {
      label: formatMessage({ id: "queryBuilder_operator_greaterThan" }),
      cardinality: 1
    },
    greaterThanOrEqualTo: {
      label: formatMessage({
        id: "queryBuilder_operator_greaterThanOrEqualTo"
      }),
      cardinality: 1
    },
    lessThan: {
      label: formatMessage({ id: "queryBuilder_operator_lessThan" }),
      cardinality: 1
    },
    lessThanOrEqualTo: {
      label: formatMessage({ id: "queryBuilder_operator_lessThanOrEqualTo" }),
      cardinality: 1
    },
    containsDate: {
      // Displayed as "Contains" - Used for searching "2017-08" or "2023" in dates.
      label: formatMessage({ id: "queryBuilder_operator_containsDate" }),
      cardinality: 1
    },
    between: {
      label: formatMessage({ id: "queryBuilder_operator_between" }),
      cardinality: 1
    },
    uuid: {
      label: "UUID",
      cardinality: 1
    },
    // Special case not to display any operators.
    noOperator: {
      label: "noOperator",
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
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformTextSearchToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
    },
    vocabulary: {
      ...BasicConfig.widgets.text,
      type: "vocabulary",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryBuilderVocabularySearch
          matchType={factoryProps?.operator}
          fieldConfig={
            (factoryProps?.fieldDefinition?.fieldSettings as any)
              ?.mapping as ESIndexMapping
          }
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformTextSearchToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
    },
    autoComplete: {
      ...BasicConfig.widgets.text,
      type: "autoComplete",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryBuilderAutoSuggestionTextSearchMemo
          currentFieldName={factoryProps?.field}
          matchType={factoryProps?.operator}
          indexName={indexName}
          indexMap={indexMap}
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformTextSearchToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
    },
    // UUID is a special type used for custom views.
    uuid: {
      ...BasicConfig.widgets.text,
      type: "uuid",
      valueSrc: "value",
      factory: () => <></>,
      elasticSearchFormatValue: (_queryType, val, _op, field, _config) =>
        transformUUIDSearchToDSL({
          fieldPath: field,
          value: val
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
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformDateSearchToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
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
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformNumberSearchToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
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
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformBooleanSearchToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
    },
    globalSearch: {
      ...BasicConfig.widgets.text,
      type: "globalSearch",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowGlobalSearchSearch
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
        />
      ),
      elasticSearchFormatValue: (_queryType, val, _op, field, _config) => {
        return transformGlobalSearchToDSL({
          value: val,
          fieldPath: field,
          operation: "",
          queryType: ""
        });
      }
    },
    managedAttribute: {
      ...BasicConfig.widgets.text,
      type: "managedAttribute",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowManagedAttributeSearch
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
          managedAttributeConfig={
            (factoryProps?.fieldDefinition?.fieldSettings as any)
              ?.mapping as ESIndexMapping
          }
          indexMap={indexMap}
          isInColumnSelector={false}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformManagedAttributeToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings,
          indexMap
        });
      }
    },
    fieldExtension: {
      ...BasicConfig.widgets.text,
      type: "fieldExtension",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowFieldExtensionSearch
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
          fieldExtensionConfig={
            (factoryProps?.fieldDefinition?.fieldSettings as any)
              ?.mapping as ESIndexMapping
          }
          isInColumnSelector={false}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformFieldExtensionToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings,
          indexMap
        });
      }
    },
    identifier: {
      ...BasicConfig.widgets.text,
      type: "identifier",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowIdentifierSearch
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
          identifierConfig={
            (factoryProps?.fieldDefinition?.fieldSettings as any)
              ?.mapping as ESIndexMapping
          }
          indexMap={indexMap}
          isInColumnSelector={false}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformIdentifierToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings,
          indexMap
        });
      }
    },
    relationshipPresence: {
      ...BasicConfig.widgets.text,
      type: "relationshipPresence",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowRelationshipPresenceSearch
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
          indexMapping={indexMap}
          isInColumnSelector={false}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformRelationshipPresenceToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings,
          indexMap
        });
      }
    },
    classification: {
      ...BasicConfig.widgets.text,
      type: "classification",
      valueSrc: "value",
      factory: (factoryProps) => (
        <QueryRowClassificationSearch
          value={factoryProps?.value}
          setValue={factoryProps?.setValue}
          isInColumnSelector={false}
        />
      ),
      elasticSearchFormatValue: (queryType, val, op, field, _config) => {
        const indexSettings = fieldValueToIndexSettings(field, indexMap);
        return transformClassificationToDSL({
          fieldPath: indexSettingsToFieldPath(indexSettings),
          operation: op,
          value: val,
          queryType,
          fieldInfo: indexSettings
        });
      }
    }
  };

  const types: Types = {
    text: {
      valueSources: ["value"],
      widgets: {
        text: {
          operators: [
            "exactMatch", // Only displayed if keyword support exists.
            "wildcard",
            "in",
            "notIn",
            "between", // Only displayed if supported in the mapping for text.
            "startsWith", // Only displayed if supported on the mapping.
            "containsText", // Only displayed if supported on the mapping.
            "endsWith", // Only displayed if supported on the mapping.
            "notEquals",
            "empty",
            "notEmpty"
          ]
        }
      }
    },
    vocabulary: {
      valueSources: ["value"],
      widgets: {
        vocabulary: {
          operators: ["equals", "notEquals", "in", "notIn", "empty", "notEmpty"]
        }
      }
    },
    autoComplete: {
      valueSources: ["value"],
      defaultOperator: "equals",
      widgets: {
        autoComplete: {
          operators: ["equals", "notEquals", "in", "notIn", "empty", "notEmpty"]
        }
      }
    },
    uuid: {
      valueSources: ["value"],
      defaultOperator: "uuid",
      widgets: {
        uuid: {
          operators: ["uuid"]
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
            "containsDate",
            "between",
            "in",
            "notIn",
            "greaterThan",
            "greaterThanOrEqualTo",
            "lessThan",
            "lessThanOrEqualTo",
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
            "in",
            "notIn",
            "between",
            "greaterThan",
            "greaterThanOrEqualTo",
            "lessThan",
            "lessThanOrEqualTo",
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
    },
    globalSearch: {
      valueSources: ["value"],
      defaultOperator: "noOperator",
      widgets: {
        globalSearch: {
          operators: ["noOperator"]
        }
      }
    },
    managedAttribute: {
      valueSources: ["value"],
      defaultOperator: "noOperator",
      widgets: {
        managedAttribute: {
          operators: ["noOperator"]
        }
      }
    },
    fieldExtension: {
      valueSources: ["value"],
      defaultOperator: "noOperator",
      widgets: {
        fieldExtension: {
          operators: ["noOperator"]
        }
      }
    },
    identifier: {
      valueSources: ["value"],
      defaultOperator: "noOperator",
      widgets: {
        identifier: {
          operators: ["noOperator"]
        }
      }
    },
    relationshipPresence: {
      valueSources: ["value"],
      defaultOperator: "noOperator",
      widgets: {
        relationshipPresence: {
          operators: ["noOperator"]
        }
      }
    },
    classification: {
      valueSources: ["value"],
      defaultOperator: "noOperator",
      widgets: {
        classification: {
          operators: ["noOperator"]
        }
      }
    }
  };

  const renderSettings: RenderSettings = {
    renderButton: (buttonProps) => {
      if (buttonProps) {
        switch (buttonProps?.type) {
          case "addRule":
            return (
              <Button onClick={buttonProps?.onClick} className="ms-1">
                <MdPlaylistAdd className="me-2" />
                {buttonProps.label}
              </Button>
            );
          case "addGroup":
            return (
              <Button onClick={buttonProps?.onClick} className="ms-1">
                <LuParentheses className="me-2" />
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
        currentField={fieldDropdownProps?.selectedPath?.join(".") ?? ""}
        setField={fieldDropdownProps?.setField}
        isInColumnSelector={false}
        nonSearchableColumns={nonSearchableColumns}
      />
    ),
    renderOperator: (operatorDropdownProps) => {
      const indexSettings = fieldValueToIndexSettings(
        (operatorDropdownProps as any)?.fieldConfig?.fieldSettings?.mapping
          ?.value,
        indexMap
      );

      return (
        <QueryOperatorSelector
          options={operatorDropdownProps?.items}
          selectedOperator={operatorDropdownProps?.selectedKey ?? ""}
          setOperator={operatorDropdownProps?.setField}
          selectedFieldMapping={indexSettings}
        />
      );
    },
    renderConjs: (conjunctionProps) => (
      <QueryConjunctionSwitch
        currentConjunction={conjunctionProps?.selectedConjunction}
        setConjunction={conjunctionProps?.setConjunction}
        disabled={conjunctionProps?.disabled}
      />
    )
  };

  const localeSettings: LocaleSettings = {
    addRuleLabel: formatMessage({ id: "queryBuilder_addSearchRule" }),
    addGroupLabel: formatMessage({ id: "queryBuilder_addSearchGroup" })
  };

  const settings: Settings = {
    ...BasicConfig.settings,
    ...renderSettings,
    ...localeSettings,
    showNot: false,
    canRegroup: true,
    canReorder: true,
    clearValueOnChangeField: true,
    clearValueOnChangeOp: true,
    showErrorMessage: true,
    removeIncompleteRulesOnLoad: false,
    removeEmptyGroupsOnLoad: false
  };

  const fields: Fields = Object.assign(
    {},
    // Support all fields from the index map.
    ...indexMap.map((indexItem: ESIndexMapping) => {
      const field = {};
      const type = getQueryBuilderTypeFromIndexType(
        indexItem.type,
        indexItem.distinctTerm,
        indexItem?.dynamicField?.type === "vocabulary"
      );

      // Value is used for the field name since it's required to be unique. It should not be used
      // for the path.
      field[indexItem.value] = {
        label: indexItem.label,
        type,
        valueSources: ["value"],
        fieldSettings: {
          mapping: indexItem
        }
      };
      return field;
    }),

    // Support all first level fields from the custom view.
    ...(customViewFields
      ? customViewFields.map((customViewField: CustomViewField) => {
          const field = {};
          field[customViewField.fieldName] = {
            label: customViewField.fieldName,
            type: customViewField.type,
            valueSources: ["value"]
          };
          return field;
        })
      : []),

    // Global Search support
    {
      [GLOBAL_SEARCH_FIELDNAME]: {
        label: GLOBAL_SEARCH_FIELDNAME,
        type: "globalSearch",
        valueSources: ["value"],
        fieldSettings: {
          isGlobalSearch: true
        }
      }
    },

    // Relationship Presence support
    ...(enableRelationshipPresence === true
      ? [
          {
            [RELATIONSHIP_PRESENCE_FIELDNAME]: {
              label: RELATIONSHIP_PRESENCE_FIELDNAME,
              type: "relationshipPresence",
              valueSources: ["value"]
            }
          }
        ]
      : [])
  );

  return {
    ctx: BasicConfig.ctx,
    conjunctions,
    operators,
    widgets,
    types,
    settings,
    fields
  };
}
