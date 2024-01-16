import React from "react";
import DatePicker from "react-datepicker";
import {
  includedTypeQuery,
  rangeQuery,
  existsQuery,
  inRangeQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { TransformToDSLProps } from "../../types";
import { DATE_REGEX_PARTIAL, DATE_REGEX_MULTIPLE } from "common-ui/lib";
import moment from "moment";
import { useIntl } from "react-intl";

interface QueryBuilderDateSearchProps {
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

export default function QueryBuilderDateSearch({
  matchType,
  value,
  setValue
}: QueryBuilderDateSearchProps) {
  const { formatMessage } = useIntl();

  return (
    <>
      {matchType !== "empty" && matchType !== "notEmpty" && matchType !== "in" && matchType !== "notIn" && (
        <DatePicker
          className="form-control"
          value={value}
          onChange={(newDate: Date, event) => {
            if (
              !event ||
              event?.type === "click" ||
              event?.type === "keydown"
            ) {
              setValue?.(newDate && newDate.toISOString().slice(0, 10));
            }
          }}
          onChangeRaw={(event) => {
            if (event?.type === "change") {
              let newText = event.target.value;
              const dashOccurrences = newText.split("-").length - 1;
              if (newText.length === 8 && dashOccurrences === 0) {
                newText =
                  newText.slice(0, 4) +
                  "-" +
                  newText.slice(4, 6) +
                  "-" +
                  newText.slice(6);
              }
              setValue?.(newText);
            }
          }}
          dateFormat="yyyy-MM-dd"
          placeholderText="YYYY-MM-DD"
          isClearable={true}
          showYearDropdown={true}
          todayButton="Today"
        />
      )}
      {(matchType === "in" || matchType === "notIn") && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(newValue) => setValue?.(newValue?.target?.value)}
          className="form-control"
          placeholder={formatMessage({ id: "queryBuilder_value_in_placeholder" })}
        />
      )}
    </>
  );
}

/**
 * Using the query row for a date search, generate the elastic search request to be made.
 */
export function transformDateSearchToDSL({
  operation,
  value,
  fieldInfo,
  fieldPath
}: TransformToDSLProps): any {
  if (!fieldInfo) {
    return {};
  }

  const { parentType, parentName, subType } = fieldInfo;

  switch (operation) {
    // Contains / less than / greater than / less than or equal to / greater than or equal to.
    case "containsDate":
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
                      fieldPath,
                      buildDateRangeObject(operation, value, subType)
                    ),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : rangeQuery(
            fieldPath,
            buildDateRangeObject(operation, value, subType)
          );

    // Comma-separated date search.
    case "in":
    case "notIn":
      return inRangeQuery(fieldPath, value, parentType, operation === "notIn");

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
                        must_not: rangeQuery(
                          fieldPath,
                          buildDateRangeObject(operation, value, subType)
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
                    must_not: rangeQuery(
                      fieldPath,
                      buildDateRangeObject(operation, value, subType)
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

    // Not empty values only. (only if the value is not mandatory)
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

    // default case
    default:
      return parentType
        ? {
            nested: {
              path: "included",
              query: {
                bool: {
                  must: [
                    rangeQuery(
                      fieldPath,
                      buildDateRangeObject(operation, value, subType)
                    ),
                    includedTypeQuery(parentType)
                  ]
                }
              }
            }
          }
        : rangeQuery(
            fieldPath,
            buildDateRangeObject(operation, value, subType)
          );
  }
}

/**
 * Generates the time_zone to return with the elastic search response.
 *
 * This will retrieve the users current timezone offset.
 *
 * This will return the offset in ISO 8601 UTC offset format, such as +01:00 or -08:00.
 */
function getTimezoneOffset() {
  const utcOffsetMinutes = moment().utcOffset();
  const formattedOffset = moment().utcOffset(utcOffsetMinutes).format("Z");

  const utcTimeOffset = {
    time_zone: formattedOffset
  };

  return utcTimeOffset;
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
 * Timezone is also determined and included in the request here if the subtype supports it.
 *
 * @param matchType the operator type (example: greaterThan ---> gt)
 * @param value The operator value to search against.
 * @param subType subtype of the date, used to determine if timezone should be included.
 * @returns numerical operator and value.
 */
function buildDateRangeObject(matchType, value, subType) {
  // Local date does not store timezone, ignore it.
  const timezone =
    subType !== "local_date" && subType !== "local_date_time"
      ? getTimezoneOffset()
      : undefined;

  switch (matchType) {
    case "containsDate":
      const YEAR_REGEX = /^\d{4}$/;
      const MONTH_REGEX = /^\d{4}-\d{2}$/;

      // Check if the value matches the year regex
      if (YEAR_REGEX.test(value)) {
        return {
          ...timezone,
          gte: `${value}||/y`,
          lte: `${value}||/y`,
          format: "yyyy"
        };
      }

      // Check if the value matches the month regex
      if (MONTH_REGEX.test(value)) {
        return {
          ...timezone,
          gte: `${value}||/M`,
          lte: `${value}||/M`,
          format: "yyyy-MM"
        };
      }

      // Otherwise just try to match the full date provided.
      return {
        ...timezone,
        gte: `${value}||/d`,
        lte: `${value}||/d`,
        format: "yyyy-MM-dd"
      };
    case "greaterThan":
      return { ...timezone, gt: value };
    case "greaterThanOrEqualTo":
      return { ...timezone, gte: value };
    case "lessThan":
      return { ...timezone, lt: value };
    case "lessThanOrEqualTo":
      return { ...timezone, lte: value };

    // Exact match case:
    default:
      return {
        ...timezone,
        gte: `${value}`,
        lte: `${value}`,
        format: "yyyy-MM-dd"
      };
  }
}

/**
 * Validate the date string to ensure it's something elastic search can accept.
 *
 * Partial dates and multiple dates are supported here.
 * @param value date value
 * @param formatMessage error message translation locale
 * @return null if valid, string error if not valid.
 */
export function validateDate(value, formatMessage): string | null {
  if (DATE_REGEX_PARTIAL.test(value)) {
    return null;
  }

  return formatMessage({ id: "dateMustBeFormattedPartial" });
}
