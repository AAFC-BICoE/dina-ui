import React from "react";
import { NumberField, FieldSpy } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps, QueryRowExportProps } from "../QueryRow";
import {
  includedTypeQuery,
  rangeQuery,
  termQuery,
  existsQuery
} from "../../util/transformToDSL";

/**
 * The match options when a number search is being performed.
 *
 * Empty and Not Empty can be used if the number value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Greater than", value: "greaterThan" },
  { label: "Greater than or equal to", value: "greaterThanOrEqualTo" },
  { label: "Less than", value: "lessThan" },
  { label: "Less than or equal to", value: "lessThanOrEqualTo" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowNumberSearchProps {
  /**
   * The form name for the whole query builder.
   */
  queryBuilderName: string;

  /**
   * The index where this search is being performed from.
   *
   * This is because you can have multiple QueryRows in the same QueryBuilder.
   */
  index: number;
}

export default function QueryRowNumberSearch({
  queryBuilderName,
  index
}: QueryRowNumberSearchProps) {
  return (
    <>
      <SelectField
        name={fieldProps(queryBuilderName, "matchType", index)}
        options={queryRowMatchOptions}
        className="me-1 flex-fill"
        removeLabel={true}
      />

      {/* Depending on the matchType, it changes the rest of the query row. */}
      <FieldSpy<string>
        fieldName={fieldProps(queryBuilderName, "matchType", index)}
      >
        {(matchType, _fields) =>
          matchType !== "empty" &&
          matchType !== "notEmpty" && (
            <NumberField
              name={fieldProps(queryBuilderName, "number", index)}
              className="me-2 flex-fill"
              removeLabel={true}
            />
          )
        }
      </FieldSpy>
    </>
  );
}

/**
 * Using the query row for a number search, generate the elastic search request to be made.
 */
export function transformNumberSearchToDSL(
  queryRow: QueryRowExportProps,
  fieldName: string
): any {
  const { matchType, number: numberValue, parentType, parentName } = queryRow;

  switch (matchType) {
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
                      fieldName,
                      buildNumberRangeObject(matchType, numberValue)
                    ),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : rangeQuery(fieldName, buildNumberRangeObject(matchType, numberValue));

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
                        must_not: termQuery(fieldName, numberValue, false),
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
                        must_not: existsQuery(fieldName),
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
                    must_not: termQuery(fieldName, numberValue, false)
                  }
                },
                {
                  bool: {
                    must_not: existsQuery(fieldName)
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
                              existsQuery(fieldName),
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
              must_not: existsQuery(fieldName)
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
                  must: [existsQuery(fieldName), includedTypeQuery(parentType)]
                }
              }
            }
          }
        : existsQuery(fieldName);

    // Equals and default case
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    termQuery(fieldName, numberValue, false),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : termQuery(fieldName, numberValue, false);
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
    default:
      return value;
  }
}
