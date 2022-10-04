import React from "react";
import { QueryRowExportProps } from "../QueryRow";
import {
  includedTypeQuery,
  matchQuery,
  termQuery,
  existsQuery
} from "../../util/transformToDSL";

interface QueryRowTextSearchProps {
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

export default function QueryRowTextSearch({
  matchType,
  value,
  setValue
}: QueryRowTextSearchProps) {
  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {(matchType === "exactMatch" ||
        matchType === "partialMatch" ||
        matchType === "notEquals") && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(newValue) => setValue?.(newValue?.target?.value)}
          style={{ flex: "fit-content" }}
          className="form-control"
        />
      )}
    </>
  );
}

/**
 * Using the query row for a text search, generate the elastic search request to be made.
 */
export function transformTextSearchToDSL(
  queryRow: QueryRowExportProps,
  fieldName: string
): any {
  const {
    matchType,
    textMatchType,
    matchValue,
    distinctTerm,
    parentType,
    parentName
  } = queryRow;

  // Is the "Exact" option selected? (Or if auto suggestions are being used.)
  const isExactMatch: boolean = distinctTerm || textMatchType === "exact";

  switch (matchType) {
    // Equals match type.
    case "equals":
      // Autocompletion expects to use the full text search.
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    isExactMatch
                      ? termQuery(fieldName, matchValue, true)
                      : matchQuery(fieldName, matchValue),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : isExactMatch
        ? termQuery(fieldName, matchValue, true)
        : matchQuery(fieldName, matchValue);

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
                        must_not: isExactMatch
                          ? termQuery(fieldName, matchValue, true)
                          : matchQuery(fieldName, matchValue),
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
                    must_not: isExactMatch
                      ? termQuery(fieldName, matchValue, true)
                      : matchQuery(fieldName, matchValue)
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
                                termQuery(fieldName, "", true),
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
                    must: termQuery(fieldName, "", true)
                  }
                }
              ]
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
                  must_not: termQuery(fieldName, "", true),
                  must: [includedTypeQuery(parentType), existsQuery(fieldName)]
                }
              }
            }
          }
        : {
            bool: {
              must: existsQuery(fieldName),
              must_not: termQuery(fieldName, "", true)
            }
          };

    // Default case
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    matchQuery(fieldName, matchValue),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : matchQuery(fieldName, matchValue);
  }
}
