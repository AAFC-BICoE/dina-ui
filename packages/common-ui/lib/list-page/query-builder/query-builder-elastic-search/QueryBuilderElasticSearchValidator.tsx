import { Config, ImmutableTree } from "@react-awesome-query-builder/ui";
import { validateDate } from "../query-builder-value-types/QueryBuilderDateSearch";
import { validateNumber } from "../query-builder-value-types/QueryBuilderNumberSearch";
import { validateManagedAttribute } from "../query-builder-value-types/QueryBuilderManagedAttributeSearch";
import _ from "lodash";

export interface ValidationError {
  /** Error message to display to the user. */
  errorMessage: string;

  /** Field name where the error occurred. */
  fieldName: string;
}

export type ValidationResult = true | ValidationError;

export function isValidationResult(object: any): object is ValidationResult {
  return "errorMessage" in object;
}

/**
 * Given a query tree, this function will return all the validation errors present. An empty array
 * if no validation errors exist.
 *
 * @param queryTree The current query tree to test for errors.
 * @param config Query builder configuration
 * @param formatMessage Instance of the formatMessage for translation of error messages.
 * @returns ValidationError array, can be an empty array if no errors found.
 */
export function getElasticSearchValidationResults(
  queryTree: ImmutableTree,
  config: Config,
  formatMessage: any
): ValidationError[] {
  const results = elasticSearchFormatValidator(
    queryTree,
    config,
    formatMessage
  );

  if (results === true || isValidationResult(results)) {
    return results === true ? [] : [results];
  } else {
    // Filter out "true" values and return only ValidationError objects:
    const validationErrors = _.flattenDeep(results).filter(
      (result): result is ValidationError => result !== true
    );

    // Ensure an empty array is returned if no validation errors are present:
    return validationErrors.length > 0 ? validationErrors : [];
  }
}

/**
 * Checks the current queryTree for validation errors (For example, date in wrong format).
 *
 * This function will determine if it should be done on a rule or group.
 *
 * @param queryTree The current tree that will be validated.
 * @param config Query builder elasticsearch.
 */
function elasticSearchFormatValidator(
  queryTree: ImmutableTree,
  config: Config,
  formatMessage: any
): ValidationResult[] | ValidationResult {
  if (!queryTree) return true;
  const type = queryTree.get("type");
  const properties = queryTree.get("properties") || new Map();

  if (properties.get("field")) {
    const operator = properties.get("operator");
    const field = properties.get("field");
    const value = properties.get("value").toJS();
    return validateEsRule(field, value, operator, config, formatMessage);
  }

  if (type === "group" || type === "switch_group") {
    let conjunction = properties.get("conjunction");
    if (!conjunction) conjunction = "AND";
    const children = queryTree.get("children1");
    return validateEsGroup(
      children,
      elasticSearchFormatValidator,
      config,
      formatMessage
    );
  }

  return true;
}

/**
 * Function for validating a single rule.
 *
 * @param fieldName path of the rule being validated.
 * @param value Unformatted rule.
 * @param operator Operator being used (e.g. "equals")
 * @param config Elasticsearch Config
 * @returns A single validation result.
 */
export function validateEsRule(
  fieldName: string,
  value: string,
  operator: string,
  config: Config,
  formatMessage: any
): ValidationResult {
  const widgetName = config.fields?.[fieldName]?.type;
  const widgetConfig = config.widgets[widgetName];
  if (!widgetConfig) return true; // Unable to find the widget.

  // Use the custom logic by default.
  let formattedValue = value?.[0] ?? "";
  if (typeof formattedValue === "string") {
    formattedValue = formattedValue.trim();
  }

  // Retrieve the field name label
  const fieldLabel = formatMessage({
    id: "field_" + (config.fields?.[fieldName]?.label ?? fieldName)
  });

  // For all the different widgets, a validate date function can be setup to do custom validation.
  switch (widgetName) {
    case "number":
      return validateNumber(
        fieldLabel,
        formattedValue,
        operator,
        formatMessage
      );
    case "date":
      return validateDate(fieldLabel, formattedValue, operator, formatMessage);
    case "managedAttribute":
      return validateManagedAttribute(
        fieldLabel,
        formattedValue,
        operator,
        formatMessage
      );
  }

  return true;
}

/**
 * Logic for validating a group of rules.
 *
 * @param children
 * @param conjunction
 * @param recursiveFunction
 * @param config
 * @returns
 */
function validateEsGroup(
  children,
  recursiveFunction,
  config: Config,
  formatMessage: any
): ValidationResult[] | ValidationResult {
  // If there is nothing in the group, then nothing needs to be validated.
  if (!children || !children.size) return true;

  const childrenArray = children.valueSeq().toArray();

  const result = childrenArray.map((childTree) =>
    recursiveFunction(childTree, config, formatMessage)
  );

  // If no results, do not add this group to the query.
  if (!result.length) return true;

  return result;
}
