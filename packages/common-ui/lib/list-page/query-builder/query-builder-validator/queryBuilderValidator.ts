import { JsonTree, Config } from "@react-awesome-query-builder/ui";
import {
  SAVED_SEARCH_VERSION,
  SingleSavedSearch
} from "../../saved-searches/types";

/**
 * The purpose of this function is to check for any issues with the query.
 *
 * This method will validate the operators and fields to ensure they exist within the current
 * configuration.
 *
 * Current limitation is the operator is not checked against the type, it's check if the operator
 * is defined in the configuration. If it's invalid for the specific type it will not be caught yet.
 *
 * @param queryTree queryTree from the saved search, not validated yet.
 * @returns valid query tree, safe to load into the query builder.
 */
export function validateQueryTree(
  queryTree: JsonTree | undefined,
  config: Config
): boolean {
  // If no query tree is saved, load the default one.
  if (!queryTree) {
    return false;
  }

  const operators = findOperators(queryTree);
  const fields = findFields(queryTree);

  // Validate operators
  const validOperators = Object.keys(config.operators);
  const invalidOperators = operators.filter(
    (operator) => !validOperators.includes(operator) && operator !== ""
  );

  if (invalidOperators.length > 0) {
    console.error(`Invalid operators found: ${invalidOperators.join(", ")}`);
    return false;
  }

  // Validate fields
  const validFields = Object.keys(config.fields);
  const invalidFields = fields.filter((field) => !validFields.includes(field));

  if (invalidFields.length > 0) {
    console.error(`Invalid fields found: ${invalidFields.join(", ")}`);
    return false;
  }

  // If all operators and fields are valid
  return true;
}

/**
 * Determines if a saved search is an older verison. This is used to indicate to the user that
 * some features might be missing and to review and save their saved query.
 *
 * @param savedSearch Single Saved Search to validatate.
 * @returns true if latest verison, false otherwise.
 */
export function validateSavedSearchVerison(savedSearch: SingleSavedSearch) {
  if (!savedSearch?.version || savedSearch.version < SAVED_SEARCH_VERSION) {
    return false;
  }

  // The way column visibility is saved for managed attributes has changed, check if it's using
  // the older way and report it as an older saved search to update it.
  if (
    savedSearch.columnVisibility?.some((column) =>
      column.includes("managedAttributes.")
    )
  ) {
    return false;
  }

  return true;
}

export function findOperators(queryTree: any): string[] {
  return scanObjectForKeys(queryTree, "operator");
}

export function findFields(queryTree: any): string[] {
  return scanObjectForKeys(queryTree, "field");
}

function scanObjectForKeys(object: any, keyValue: string): string[] {
  let matches: string[] = [];

  if (typeof object === "object" && object !== null) {
    for (const key in object) {
      if (key === keyValue && object[key] !== null) {
        matches.push(object[key]);
      } else if (
        typeof object[key] === "object" ||
        Array.isArray(object[key])
      ) {
        matches = matches.concat(scanObjectForKeys(object[key], keyValue));
      }
    }
  } else if (Array.isArray(object)) {
    object.forEach((item) => {
      matches = matches.concat(scanObjectForKeys(item, keyValue));
    });
  }

  return matches;
}
