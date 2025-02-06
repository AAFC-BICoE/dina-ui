import React from "react";
import {
  includedTypeQuery,
  rangeQuery,
  termQuery,
  existsQuery,
  inQuery,
  betweenQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { TransformToDSLProps } from "../../types";
import { useIntl } from "react-intl";
import {
  convertStringToBetweenState,
  useQueryBetweenSupport
} from "../query-builder-core-components/useQueryBetweenSupport";
import { ValidationResult } from "../query-builder-elastic-search/QueryBuilderElasticSearchValidator";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";

// Decimal / Integer validation (Negative numbers supported.)
export const NUMBER_REGEX = /^-?\d+(?:\.\d+)?$/;

interface QueryBuilderNumberSearchProps {
  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

export default function QueryBuilderNumberSearch({
  matchType,
  value,
  setValue
}: QueryBuilderNumberSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  const { BetweenElement } = useQueryBetweenSupport({
    type: "number",
    matchType,
    setValue,
    value
  });

  const rangeSupport: boolean = matchType === "in" || matchType === "notIn";

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {matchType !== "empty" && matchType !== "notEmpty" && (
        <>
          {matchType === "between" ? (
            BetweenElement
          ) : (
            <input
              type={rangeSupport ? "text" : "number"}
              value={value ?? ""}
              onChange={(newValue) => setValue?.(newValue?.target?.value)}
              className="form-control"
              placeholder={formatMessage({
                id: rangeSupport
                  ? "queryBuilder_value_in_placeholder"
                  : "queryBuilder_value_number_placeholder"
              })}
              onKeyDown={onKeyDown}
            />
          )}
        </>
      )}
    </>
  );
}

/**
 * Using the query row for a number search, generate the elastic search request to be made.
 */
export function transformNumberSearchToDSL({
  operation,
  value,
  fieldInfo,
  fieldPath
}: TransformToDSLProps): any {
  if (!fieldInfo) {
    return {};
  }

  const { parentType } = fieldInfo;

  switch (operation) {
    // less than / greater than / less than or equal to / greater than or equal to.
    case "greaterThan":
    case "greaterThanOrEqualTo":
    case "lessThan":
    case "lessThanOrEqualTo":
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    rangeQuery(
                      fieldPath,
                      buildNumberRangeObject(operation, value)
                    ),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : rangeQuery(fieldPath, buildNumberRangeObject(operation, value));

    // List of numbers, comma-separated.
    case "in":
    case "notIn":
      return inQuery(
        fieldPath,
        value,
        parentType,
        false,
        operation === "notIn"
      );

    // Between (range) operator
    case "between":
      return betweenQuery(fieldPath, value, parentType, "number");

    // Not equals match type.
    case "notEquals":
      return parentType
        ? {
            bool: {
              should: [
                // If the field does exist, then search for everything that does NOT match the term.
                {
                  nested: {
                    path: "included",
                    query: {
                      bool: {
                        must_not: termQuery(fieldPath, value, false),
                        must: includedTypeQuery(parentType)
                      }
                    }
                  }
                },

                // If it's included but the field doesn't exist, then it's not equal either.
                {
                  nested: {
                    path: "included",
                    query: {
                      bool: {
                        must_not: existsQuery(fieldPath),
                        must: includedTypeQuery(parentType)
                      }
                    }
                  }
                },

                // And if it's not included, then it's not equal either.
                {
                  bool: {
                    must_not: includedTypeQuery(parentType)
                  }
                }
              ]
            }
          }
        : {
            bool: {
              should: [
                {
                  bool: {
                    must_not: termQuery(fieldPath, value, false)
                  }
                },
                {
                  bool: {
                    must_not: existsQuery(fieldPath)
                  }
                }
              ]
            }
          };

    // Empty values only. (only if the value is not mandatory)
    case "empty":
      return parentType
        ? {
            bool: {
              should: [
                {
                  bool: {
                    must_not: {
                      nested: {
                        path: "included",
                        query: {
                          bool: {
                            must: [
                              existsQuery(fieldPath),
                              includedTypeQuery(parentType)
                            ]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  bool: {
                    must_not: includedTypeQuery(parentType)
                  }
                }
              ]
            }
          }
        : {
            bool: {
              must_not: existsQuery(fieldPath)
            }
          };

    // Not empty values only. (only if the value is not mandatory)
    case "notEmpty":
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [existsQuery(fieldPath), includedTypeQuery(parentType)]
                }
              }
            }
          }
        : existsQuery(fieldPath);

    // Equals and default case
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    termQuery(fieldPath, value, false),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : termQuery(fieldPath, value, false);
  }
}

/**
 * Depending on the numerical match type, the search query changes.
 *
 * @param matchType the operator type (example: greaterThan ---> gt)
 * @param value The operator value to search against.
 * @returns numerical operator and value.
 */
function buildNumberRangeObject(matchType, value) {
  switch (matchType) {
    case "greaterThan":
      return { gt: value };
    case "greaterThanOrEqualTo":
      return { gte: value };
    case "lessThan":
      return { lt: value };
    case "lessThanOrEqualTo":
      return { lte: value };
  }
}

export function validateNumber(
  fieldName: string,
  value: string,
  operator: string,
  formatMessage: any
): ValidationResult {
  switch (operator) {
    // Ensure a number is provided for these cases.
    case "equals":
    case "notEquals":
    case "greaterThan":
    case "greaterThanOrEqualTo":
    case "lessThan":
    case "lessThanOrEqualTo":
      if (value == null || value === "") return true;
      if (!NUMBER_REGEX.test(value)) {
        return {
          errorMessage: formatMessage({ id: "numberInvalid" }),
          fieldName
        };
      }
      break;

    // Between validation
    case "between":
      const betweenStates = convertStringToBetweenState(value);
      if (betweenStates.low === "" && betweenStates.high === "") return true;

      // If just one between state is empty, then report an error.
      if (betweenStates.low === "" || betweenStates.high === "") {
        return {
          errorMessage: formatMessage({ id: "numberBetweenMissingValues" }),
          fieldName
        };
      }

      if (
        !NUMBER_REGEX.test(betweenStates.low) ||
        !NUMBER_REGEX.test(betweenStates.high)
      ) {
        return {
          errorMessage: formatMessage({ id: "numberInvalid" }),
          fieldName
        };
      }

      if (Number(betweenStates.low) > Number(betweenStates.high)) {
        return {
          errorMessage: formatMessage({ id: "numberBetweenInvalid" }),
          fieldName
        };
      }
      break;

    case "in":
    case "notIn":
      // Retrieve all of the potential numbers, by spliting by commas and removing leading/trailing whitespace.
      let invalidNumberFound = false;
      value
        .split(",")
        .map((item) => item.trim())
        .forEach((val) => {
          if (!NUMBER_REGEX.test(val) && val !== "") {
            invalidNumberFound = true;
          }
        });

      // If an invalid number was found, return an error message.
      if (invalidNumberFound) {
        return {
          errorMessage: formatMessage({ id: "numberInRangeInvalid" }),
          fieldName
        };
      }
      break;
  }

  return true;
}
