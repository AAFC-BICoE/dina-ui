import React from "react";
import { DateField } from "../..";
import { QueryRowExportProps } from "../QueryRow";
import {
  includedTypeQuery,
  rangeQuery,
  termQuery,
  existsQuery
} from "../../util/transformToDSL";
import { TransformToDSLProps } from "../types";

interface QueryRowDateSearchProps {
  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue: ((fieldPath: string) => void) | undefined;
}

export default function QueryRowDateSearch({
  matchType,
  value,
  setValue
}: QueryRowDateSearchProps) {
  return (
    <>
      {matchType !== "empty" && matchType !== "notEmpty" && (
        <DateField name="this" removeLabel={true} partialDate={true} />
      )}
    </>
  );
}

/**
 * Using the query row for a date search, generate the elastic search request to be made.
 */
export function transformDateSearchToDSL({
  operation,
  value,
  fieldInfo,
  fieldPath
}: TransformToDSLProps): any {
  if (!fieldInfo) {
    return {};
  }

  const { parentType, parentName } = fieldInfo;

  switch (operation) {
    // Contains / less than / greater than / less than or equal to / greater than or equal to.
    case "contains":
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
                      buildDateRangeObject(fieldPath, value)
                    ),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : rangeQuery(fieldPath, buildDateRangeObject(operation, value));

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
                    must_not: existsQuery(
                      "data.relationships." + parentName + ".data.id"
                    )
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
                    must_not: existsQuery(
                      "data.relationships." + parentName + ".data.id"
                    )
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
 * Equal is ignored here since it should not be handled like this.
 *
 * Contains is a special case since it is not a date match, it treats it as a range of dates. For
 * example:
 *
 * "2022" will display all records that contain 2022 in the date field. So the following would be
 * matched:
 *    - 2022-01-01
 *    - 2022-12-02
 *    - 2022-05-19
 *    - 2022-07
 *    - 2022
 *
 * When using Equals to search for a date, the following would be matched for "2022":
 *    - 2022
 *
 * @param matchType the operator type (example: greaterThan ---> gt)
 * @param value The operator value to search against.
 * @returns numerical operator and value.
 */
function buildDateRangeObject(matchType, value) {
  switch (matchType) {
    case "contains":
      const YEAR_REGEX = /^\d{4}$/;
      const MONTH_REGEX = /^\d{4}-\d{2}$/;

      // Check if the value matches the year regex
      if (YEAR_REGEX.test(value)) {
        return {
          gte: `${value}||/y`,
          lte: `${value}||/y`,
          format: "yyyy"
        };
      }

      // Check if the value matches the month regex
      if (MONTH_REGEX.test(value)) {
        return {
          gte: `${value}||/M`,
          lte: `${value}||/M`,
          format: "yyyy-MM"
        };
      }

      // Otherwise just try to match the full date provided.
      return {
        gte: `${value}||/d`,
        lte: `${value}||/d`,
        format: "yyyy-MM-dd"
      };
    case "greaterThan":
      return { gt: value };
    case "greaterThanOrEqualTo":
      return { gte: value };
    case "lessThan":
      return { lt: value };
    case "lessThanOrEqualTo":
      return { lte: value };
    default:
      return value;
  }
}
