import React from "react";
import { QueryRowExportProps } from "../QueryRow";
import {
  includedTypeQuery,
  termQuery,
  existsQuery
} from "../../util/transformToDSL";
import Select from "react-select";
import { TransformToDSLProps } from "../types";

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
export function transformBooleanSearchToDSL({
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

    // Not Empty for the boolean.
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

    // Exact match for the boolean.
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
