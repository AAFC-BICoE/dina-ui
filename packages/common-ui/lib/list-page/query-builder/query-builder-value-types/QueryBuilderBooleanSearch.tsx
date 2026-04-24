import React, { useEffect } from "react";
import {
  includedTypeQuery,
  termQuery,
  emptyFieldQuery,
  notEmptyFieldQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import Select from "react-select";
import { TransformToDSLProps } from "../../types";
import { useIntl } from "react-intl";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";

interface QueryBuilderBooleanSearchProps {
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

export default function QueryBuilderBooleanSearch({
  matchType,
  value,
  setValue
}: QueryBuilderBooleanSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  // Use true as the default.
  useEffect(() => {
    if (matchType === "equals" && !value) {
      setValue?.("true");
    }
  }, [matchType, value, setValue]);

  /**
   * The possible states of a boolean if the Equals match is being used.
   */
  const QueryBuilderBooleanOptions = [
    { label: formatMessage({ id: "queryBuilder_value_true" }), value: "true" },
    { label: formatMessage({ id: "queryBuilder_value_false" }), value: "false" }
  ];

  const safeValue = value || "true";
  const selectedOption = QueryBuilderBooleanOptions.find(
    (option) => option.value === safeValue
  );

  return (
    <>
      {matchType === "equals" && (
        <Select
          value={selectedOption}
          options={QueryBuilderBooleanOptions as any}
          className="flex-fill"
          onChange={(selected) => setValue?.(selected?.value ?? "true")}
          onKeyDown={onKeyDown}
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

  const { parentType } = fieldInfo;

  const safeValue = value || "true";

  switch (operation) {
    // Empty values only.
    case "empty":
      return emptyFieldQuery(fieldPath, parentType);

    // Not empty values only.
    case "notEmpty":
      return notEmptyFieldQuery(fieldPath, parentType);

    // Exact match for the boolean.
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    termQuery(fieldPath, safeValue, false),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : termQuery(fieldPath, safeValue, false);
  }
}
