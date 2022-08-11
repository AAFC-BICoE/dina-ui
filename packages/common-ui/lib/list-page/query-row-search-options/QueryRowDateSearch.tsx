import React from "react";
import { DateField, FieldSpy } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { ElasticSearchQueryParams } from "../../util/transformToDSL";
import { fieldProps, QueryRowExportProps } from "../QueryRow";

/**
 * The match options when a date search is being performed.
 *
 * Equals is for an exact match. Example: "2020-01-01", then only on that specific date.
 * Contains is for a partial match. Example: "2020", then on any date that is in 2020 will match.
 * Empty and Not Empty can be used if the date value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Contains", value: "contains" },
  { label: "Greater than", value: "greaterThan" },
  { label: "Greater than or equal to", value: "greaterThanOrEqualTo" },
  { label: "Less than", value: "lessThan" },
  { label: "Less than or equal to", value: "lessThanOrEqualTo" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowDateSearchProps {
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

export default function QueryRowDateSearch({
  queryBuilderName,
  index
}: QueryRowDateSearchProps) {
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
          matchType !== "empty" &&
          matchType !== "notEmpty" && (
            <DateField
              name={fieldProps(queryBuilderName, "date", index)}
              className="me-2 flex-fill"
              removeLabel={true}
              partialDate={true}
            />
          )
        }
      </FieldSpy>
    </>
  );
}

/**
 * Using the query row for a date search, generate the elastic search request to be made.
 *
 * @param builder The elastic search bodybuilder object.
 * @param queryRow The query row to be used.
 */
export function transformDateSearchToDSL(
  queryRow: QueryRowExportProps
): ElasticSearchQueryParams[] {
  const { matchType, date } = queryRow;

  switch (matchType) {
    // Contains / less than / greater than / less than or equal to / greater than or equal to.
    case "contains":
    case "greaterThan":
    case "greaterThanOrEqualTo":
    case "lessThan":
    case "lessThanOrEqualTo":
      return [
        {
          queryOperator: "must",
          queryType: "range",
          value: buildDateRangeObject(matchType, date)
        }
      ];

    // Not equals match type.
    case "notEquals":
      return [{ queryOperator: "must_not", queryType: "term", value: date }];

    // Empty values only. (only if the value is not mandatory)
    case "empty":
      return [{ queryOperator: "must_not", queryType: "exists" }];

    // Not empty values only. (only if the value is not mandatory)
    case "notEmpty":
      return [{ queryOperator: "must", queryType: "exists" }];

    // Equals and default case
    default:
      return [{ queryOperator: "must", queryType: "term", value: date }];
  }
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
 * @param matchType the operator type (example: greaterThan ---> gt)
 * @param value The operator value to search against.
 * @returns numerical operator and value.
 */
function buildDateRangeObject(matchType, value) {
  switch (matchType) {
    case "contains":
      const YEAR_REGEX = /^\d{4}$/;
      const MONTH_REGEX = /^\d{4}-\d{2}$/;

      // Check if the value matches the year regex
      if (YEAR_REGEX.test(value)) {
        return {
          gte: `${value}||/y`,
          lte: `${value}||/y`,
          format: "yyyy"
        };
      }

      // Check if the value matches the month regex
      if (MONTH_REGEX.test(value)) {
        return {
          gte: `${value}||/M`,
          lte: `${value}||/M`,
          format: "yyyy-MM"
        };
      }

      // Otherwise just try to match the full date provided.
      return {
        gte: `${value}||/d`,
        lte: `${value}||/d`,
        format: "yyyy-MM-dd"
      };
    case "greaterThan":
      return { gt: value };
    case "greaterThanOrEqualTo":
      return { gte: value };
    case "lessThan":
      return { lt: value };
    case "lessThanOrEqualTo":
      return { lte: value };
    default:
      return value;
  }
}
