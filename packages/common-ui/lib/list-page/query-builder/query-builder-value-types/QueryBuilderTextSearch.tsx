import React from "react";
import {
  includedTypeQuery,
  matchQuery,
  termQuery,
  existsQuery,
  prefixQuery,
  suffixQuery,
  infixQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { TransformToDSLProps } from "../../types";
import { useIntl } from "react-intl";

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
  const { formatMessage } = useIntl();

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {matchType !== "empty" && matchType !== "notEmpty" && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(newValue) => setValue?.(newValue?.target?.value)}
          className="form-control"
          placeholder={formatMessage({
            id: "queryBuilder_value_text_placeholder"
          })}
        />
      )}
    </>
  );
}

/**
 * Using the query row for a text search, generate the elastic search request to be made.
 */
export function transformTextSearchToDSL({
  operation,
  value,
  fieldInfo,
  fieldPath
}: TransformToDSLProps): any {
  if (!fieldInfo) {
    return {};
  }

  const { distinctTerm, parentType, parentName } = fieldInfo;

  // Is the "Exact" option selected? (Or if auto suggestions are being used.)
  const isExactMatch: boolean = distinctTerm || operation === "exactMatch";

  switch (operation) {
    // Equals match type.
    case "equals":
    case "partialMatch":
    case "exactMatch":
      // Autocompletion expects to use the full text search.
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    isExactMatch
                      ? termQuery(fieldPath, value, true)
                      : matchQuery(fieldPath, value),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : isExactMatch
        ? termQuery(fieldPath, value, true)
        : matchQuery(fieldPath, value);

    // Prefix partial match
    case "startsWith":
      return prefixQuery(fieldPath, value, parentType);

    // Infix partial match
    case "containsText":
      return infixQuery(fieldPath, value, parentType);

    // Suffix partial match
    case "endsWith":
      return suffixQuery(fieldPath, value, parentType);

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
                          ? termQuery(fieldPath, value, true)
                          : matchQuery(fieldPath, value),
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
                    must_not: isExactMatch
                      ? termQuery(fieldPath, value, true)
                      : matchQuery(fieldPath, value)
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
                        nested: {
                          path: "included",
                          query: {
                            bool: {
                              must: [
                                termQuery(fieldPath, "", true),
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
                    must_not: existsQuery(fieldPath)
                  }
                },
                {
                  bool: {
                    must: termQuery(fieldPath, "", true)
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
                  must_not: termQuery(fieldPath, "", true),
                  must: [includedTypeQuery(parentType), existsQuery(fieldPath)]
                }
              }
            }
          }
        : {
            bool: {
              must: existsQuery(fieldPath),
              must_not: termQuery(fieldPath, "", true)
            }
          };

    // Unsupported case.
    default:
      throw new Error("Unsupported operation for the text widget.");
  }
}
