import React from "react";
import { NumberField, FieldSpy } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps } from "../QueryRow";

/**
 * The match options when a number search is being performed.
 *
 * Empty and Not Empty can be used if the number value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Greater than", value: "greaterThan" },
  { label: "Greater than or equal to", value: "greaterThanOrEqualTo" },
  { label: "Less than", value: "lessThan" },
  { label: "Less than or equal to", value: "lessThanOrEqualTo" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowNumberSearchProps {
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

export default function QueryRowNumberSearch({
  queryBuilderName,
  index
}: QueryRowNumberSearchProps) {
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
            <NumberField
              name={fieldProps(queryBuilderName, "number", index)}
              className="me-2 flex-fill"
              removeLabel={true}
            />
          )
        }
      </FieldSpy>
    </>
  );
}
