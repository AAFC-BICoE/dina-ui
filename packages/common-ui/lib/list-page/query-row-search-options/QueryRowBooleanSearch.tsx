import React from "react";
import { QueryRowExportProps } from "../QueryRow";
import {
  includedTypeQuery,
  termQuery,
  existsQuery
} from "../../util/transformToDSL";
import Select from "react-select";

/**
 * The possible states of a boolean if the Equals match is being used.
 */
const queryRowBooleanOptions = [
  { label: "True", value: "true" },
  { label: "False", value: "false" }
];

interface QueryRowBooleanSearchProps {
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

export default function QueryRowBooleanSearch({
  matchType,
  value,
  setValue
}: QueryRowBooleanSearchProps) {
  const selectedOption = queryRowBooleanOptions.find(
    (option) => option.value === value
  );

  return (
    <>
      {matchType === "equals" && (
        <Select
          value={selectedOption}
          options={queryRowBooleanOptions as any}
          className="me-1 flex-fill"
          onChange={(selected) => setValue?.(selected?.value ?? "true")}
        />
      )}
    </>
  );
}

/**
 * Using the query row for a boolean search, generate the elastic search request to be made.
 */
export function transformBooleanSearchToDSL(
  queryRow: QueryRowExportProps,
  fieldName: string
): any {
  const { matchType, boolean: booleanValue, parentType, parentName } = queryRow;

  switch (matchType) {
    // Empty for the boolean.
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

    // Not Empty for the boolean.
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

    // Exact match for the boolean.
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    termQuery(fieldName, booleanValue, false),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : termQuery(fieldName, booleanValue, false);
  }
}
