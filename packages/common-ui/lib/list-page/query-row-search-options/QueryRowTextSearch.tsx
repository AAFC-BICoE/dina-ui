import React from "react";
import { FieldWrapper } from "../..";
import { QueryRowExportProps } from "../QueryRow";
import { useIntl } from "react-intl";
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
  value: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue: ((fieldPath: string) => void) | undefined;
}

export default function QueryRowTextSearch({
  matchType,
  value,
  setValue
}: QueryRowTextSearchProps) {
  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {(matchType === "equals" || matchType === "notEquals") && (
        <input
          type="text"
          value={value}
          onChange={(newValue) => setValue?.(newValue?.target?.value ?? "")}
          className="me-1 flex-fill"
        />
      )}

      {(matchType === "equals" || matchType === "notEquals") && (
        <ExactOrPartialSwitch removeLabel={true} className={"textMatchType"} />
      )}
    </>
  );
}

/**
 * Switch used to determine if the text search is being performed on an exact or partial match.
 *
 * @param queryLogicSwitchProps props for the input. This is used to register it with formik.
 */
function ExactOrPartialSwitch(queryLogicSwitchProps) {
  const { formatMessage } = useIntl();

  return (
    <FieldWrapper {...queryLogicSwitchProps}>
      {({ value, setValue }) => {
        // Set the default to exact.
        if (value === undefined) {
          setValue("partial");
        }

        return (
          <div
            className="d-flex me-2"
            style={{
              height: "2.3em",
              borderRadius: "5px"
            }}
          >
            <style>
              {`
              .selected-logic {
                background-color: #008cff;
                color: white;
              }
              .not-selected-logic {
                background-color: #DCDCDC;
              }
            `}
            </style>
            <span
              className={`py-2 px-3 exactSpan ${
                value === "exact" ? "selected-logic" : "not-selected-logic"
              }`}
              onClick={() => {
                setValue("exact");
              }}
              style={{
                borderRadius: "5px 0 0 5px",
                borderRight: "1px",
                cursor: "pointer"
              }}
            >
              {formatMessage({ id: "exact" })}
            </span>
            <span
              className={`py-2 px-3 partialSpan ${
                value === "partial" ? "selected-logic" : "not-selected-logic"
              }`}
              onClick={() => {
                setValue("partial");
              }}
              style={{
                borderRadius: "0 5px 5px 0",
                cursor: "pointer"
              }}
            >
              {formatMessage({ id: "partial" })}
            </span>
            <input
              name={queryLogicSwitchProps.name}
              value={value}
              type="hidden"
            />
          </div>
        );
      }}
    </FieldWrapper>
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
