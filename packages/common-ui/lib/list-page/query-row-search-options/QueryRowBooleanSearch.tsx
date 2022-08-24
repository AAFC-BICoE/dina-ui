import React from "react";
import { FieldSpy } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps, QueryRowExportProps } from "../QueryRow";

/**
 * The possible states of a boolean if the Equals match is being used.
 */
const queryRowBooleanOptions = [
  { label: "True", value: "true" },
  { label: "False", value: "false" }
];

/**
 * The match options when a boolean search is being performed.
 *
 * Empty and Not Empty can be used if the boolean value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowBooleanSearchProps {
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

export default function QueryRowBooleanSearch({
  queryBuilderName,
  index
}: QueryRowBooleanSearchProps) {
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
          matchType === "equals" && (
            <SelectField
              name={fieldProps(queryBuilderName, "boolean", index)}
              options={queryRowBooleanOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )
        }
      </FieldSpy>
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
  const { matchType, boolean: booleanValue, parentType } = queryRow;

  // If it's a relationship search, ensure that the included type is being filtered out.
  const includedTypeQuery: any = parentType
    ? {
        term: {
          "included.type": parentType
        }
      }
    : {};

  switch (matchType) {
    // Empty for the boolean.
    case "empty":
      return {
        must_not: {
          exists: {
            field: fieldName
          }
        },
        ...(parentType && {
          must: includedTypeQuery
        })
      };

    // Not Empty for the boolean.
    case "notEmpty":
      return {
        must: [
          {
            exists: {
              field: fieldName
            }
          },
          ...(parentType ? includedTypeQuery : undefined)
        ]
      };

    // Exact match for the boolean.
    default:
      return {
        must: [
          {
            term: {
              [fieldName]: booleanValue
            }
          },
          includedTypeQuery
        ]
      };
  }
}
