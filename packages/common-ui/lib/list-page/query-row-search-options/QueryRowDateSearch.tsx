import React from "react";
import { DateField, FieldSpy } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps } from "../QueryRow";

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
