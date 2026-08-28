import React from "react";
import { TransformToDSLProps } from "../../types";
import { useIntl } from "react-intl";
import {
  includedTypeQuery,
  termQuery,
  existsQuery,
  prefixQuery,
  suffixQuery,
  infixQuery,
  wildcardQuery,
  inTextQuery,
  betweenQuery,
  emptyFieldQuery,
  notEmptyFieldQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { useQueryBetweenSupport } from "../query-builder-core-components/useQueryBetweenSupport";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import { FaCircleInfo } from "react-icons/fa6";

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

  const { BetweenElement } = useQueryBetweenSupport({
    type: "text",
    matchType,
    setValue,
    value
  });

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  // Check if current selection is 'in' or 'notIn'
  const isInMatchType = matchType === "in" || matchType === "notIn";

  // Count comma-separated items when 'in' or 'notIn' is active
  const itemCounts = React.useMemo(() => {
    if (!isInMatchType || !value?.trim()) return 0;
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean).length;
  }, [isInMatchType, value]);

  const exceedsItemThreshold = isInMatchType && itemCounts > 100;

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {matchType !== "empty" && matchType !== "notEmpty" && (
        <div className="d-flex flex-column gap-1">
          {matchType === "between" ? (
            BetweenElement
          ) : (
            <input
              type="text"
              value={value ?? ""}
              onChange={(newValue) => setValue?.(newValue?.target?.value)}
              className="form-control"
              placeholder={
                !isInMatchType
                  ? formatMessage({
                      id: "queryBuilder_value_text_placeholder"
                    })
                  : formatMessage({ id: "queryBuilder_value_in_placeholder" })
              }
              onKeyDown={onKeyDown}
            />
          )}

          {exceedsItemThreshold && (
            <small className="form-text text-muted">
              <FaCircleInfo className="me-2" />
              {formatMessage(
                {
                  id: "queryBuilder_value_in_case_sensitivity_notice",
                  defaultMessage:
                    "Searches with over 100 items will automatically run as case-sensitive to maintain performance."
                },
                { count: itemCounts }
              )}
            </small>
          )}
        </div>
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

  const { parentType, optimizedPrefix, keywordMultiFieldSupport } = fieldInfo;

  switch (operation) {
    // Wild card search
    case "wildcard":
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    wildcardQuery(fieldPath, value, keywordMultiFieldSupport),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : wildcardQuery(fieldPath, value, keywordMultiFieldSupport);

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

    // Between, only supported if the numeric keyword exists.
    case "between":
      return betweenQuery(fieldPath, value, parentType, "text");

    // Prefix partial match
    case "startsWith":
      return prefixQuery(
        fieldPath,
        value,
        parentType,
        optimizedPrefix,
        keywordMultiFieldSupport
      );

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
              must_not: [
                {
                  nested: {
                    path: "included",
                    query: {
                      bool: {
                        must: [
                          includedTypeQuery(parentType),
                          termQuery(fieldPath, value, keywordMultiFieldSupport)
                        ]
                      }
                    }
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

    // Empty values only.
    case "empty":
      return emptyFieldQuery(fieldPath, parentType, true);

    // Not empty values only.
    case "notEmpty":
      return notEmptyFieldQuery(fieldPath, parentType, true);

    // Equals match type.
    case "equals":
    case "exactMatch":
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
