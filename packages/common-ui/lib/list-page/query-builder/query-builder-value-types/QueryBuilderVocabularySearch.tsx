import React from "react";
import { TransformToDSLProps } from "../../types";
import { useIntl } from "react-intl";
import {
  includedTypeQuery,
  termQuery,
  existsQuery,
  inTextQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { useQueryBetweenSupport } from "../query-builder-core-components/useQueryBetweenSupport";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";

interface QueryRowVocabularySearchProps {
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

export default function QueryRowVocabularySearch({
  matchType,
  value,
  setValue
}: QueryRowVocabularySearchProps) {
  const { formatMessage } = useIntl();

  const { BetweenElement } = useQueryBetweenSupport({
    type: "text",
    matchType,
    setValue,
    value
  });

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {matchType !== "empty" && matchType !== "notEmpty" && (
        <>
          {matchType === "between" ? (
            BetweenElement
          ) : (
            <input
              type="text"
              value={value ?? ""}
              onChange={(newValue) => setValue?.(newValue?.target?.value)}
              className="form-control"
              placeholder={
                matchType !== "in" && matchType !== "notIn"
                  ? formatMessage({
                      id: "queryBuilder_value_text_placeholder"
                    })
                  : formatMessage({ id: "queryBuilder_value_in_placeholder" })
              }
              onKeyDown={onKeyDown}
            />
          )}
        </>
      )}
    </>
  );
}

/**
 * Using the query row for a vocabulary text search, generate the elastic search request to be made.
 */
export function transformVocabularySearchToDSL({
  operation,
  value,
  fieldInfo,
  fieldPath
}: TransformToDSLProps): any {
  if (!fieldInfo) {
    return {};
  }

  const { parentType, parentName, keywordMultiFieldSupport } = fieldInfo;

  switch (operation) {
    // Comma-separated search (in/not in)
    case "in":
    case "notIn":
      return inTextQuery(
        fieldPath,
        value,
        parentType,
        keywordMultiFieldSupport,
        operation === "notIn"
      );

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
                        must_not: termQuery(
                          fieldPath,
                          value,
                          keywordMultiFieldSupport
                        ),
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
                    must_not: termQuery(
                      fieldPath,
                      value,
                      keywordMultiFieldSupport
                    )
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

    // Equals match type.
    case "equals":
    default:
      // Autocompletion expects to use the full text search.
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    termQuery(fieldPath, value, keywordMultiFieldSupport),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : termQuery(fieldPath, value, keywordMultiFieldSupport);
  }
}
