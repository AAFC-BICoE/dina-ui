import React from "react";
import { DateField, FieldSpy } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps, QueryRowExportProps } from "../QueryRow";
import {
  includedTypeQuery,
  rangeQuery,
  termQuery,
  existsQuery
} from "../../util/transformToDSL";

/**
 * The match options when a date search is being performed.
 *
 * Equals is for an exact match. Example: "2020-01-01", then only on that specific date.
 * Contains is for a partial match. Example: "2020", then on any date that is in 2020 will match.
 * Empty and Not Empty can be used if the date value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Contains", value: "contains" },
  { label: "Greater than", value: "greaterThan" },
  { label: "Greater than or equal to", value: "greaterThanOrEqualTo" },
  { label: "Less than", value: "lessThan" },
  { label: "Less than or equal to", value: "lessThanOrEqualTo" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowDateSearchProps {
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

export default function QueryRowDateSearch({
  queryBuilderName,
  index
}: QueryRowDateSearchProps) {
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
            <DateField
              name={fieldProps(queryBuilderName, "date", index)}
              className="me-2 flex-fill"
              removeLabel={true}
              partialDate={true}
            />
          )
        }
      </FieldSpy>
    </>
  );
}

/**
 * Using the query row for a date search, generate the elastic search request to be made.
 */
export function transformDateSearchToDSL(
  queryRow: QueryRowExportProps,
  fieldName: string
): any {
  const { matchType, date, parentType, parentName } = queryRow;

  switch (matchType) {
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
                      fieldName,
                      buildDateRangeObject(matchType, date)
                    ),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : {
            bool: {
              must: rangeQuery(fieldName, buildDateRangeObject(matchType, date))
            }
          };

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
                        must_not: termQuery(fieldName, date, false),
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
                    must_not: termQuery(fieldName, date, false)
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
                        nested: {
                          path: "included",
                          query: {
                            bool: {
                              must: [
                                termQuery(fieldName, "", false),
                                includedTypeQuery(parentType)
                              ]
                            }
                          }
                        }
                      }
                    ]
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
              should: [
                {
                  bool: {
                    must_not: existsQuery(fieldName)
                  }
                },
                {
                  bool: {
                    must: termQuery(fieldName, "", false)
                  }
                }
              ]
            }
          };

    // Not empty values only. (only if the value is not mandatory)
    case "notEmpty":
      return parentType
        ? {
            bool: {
              should: [
                {
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
                },
                {
                  nested: {
                    path: "included",
                    query: {
                      bool: {
                        must_not: termQuery(fieldName, "", false),
                        must: includedTypeQuery(parentType)
                      }
                    }
                  }
                }
              ]
            }
          }
        : {
            bool: {
              must: existsQuery(fieldName),
              must_not: termQuery(fieldName, "", false)
            }
          };

    // Equals and default case
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    termQuery(fieldName, date, false),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : {
            bool: {
              must: termQuery(fieldName, date, false)
            }
          };
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
