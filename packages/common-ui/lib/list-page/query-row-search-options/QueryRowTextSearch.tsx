import React, { useRef, useState } from "react";
import { FieldSpy, FieldWrapper, TextField } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps, QueryRowExportProps } from "../QueryRow";
import { useIntl } from "react-intl";
import { ElasticSearchQueryParams } from "../../util/transformToDSL";

/**
 * The match options when a text search is being performed.
 *
 * Empty and Not Empty can be used if the text value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Empty", value: "empty" },
  { label: "Not Empty", value: "notEmpty" }
];

interface QueryRowTextSearchProps {
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

export default function QueryRowTextSearch({
  queryBuilderName,
  index
}: QueryRowTextSearchProps) {
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
        {(matchType, _fields) => (
          <>
            {(matchType === "equals" || matchType === "notEquals") && (
              <TextField
                name={fieldProps(queryBuilderName, "matchValue", index)}
                className="me-1 flex-fill"
                removeLabel={true}
              />
            )}

            {matchType === "equals" && (
              <ExactOrPartialSwitch
                name={fieldProps(queryBuilderName, "textMatchType", index)}
                removeLabel={true}
                className={"compoundQueryType" + index}
              />
            )}
          </>
        )}
      </FieldSpy>
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
  const [backClassName, setBackClassName] = useState({
    exact: "selected-logic",
    partial: "not-selected-logic"
  });

  const inputRef = useRef<HTMLInputElement>(null);

  function onSwitchClicked(logicName, fieldName, formik) {
    switch (logicName) {
      case "exact": {
        if (inputRef && inputRef.current) {
          formik.setFieldValue(fieldName, "exact");
        }
        return setBackClassName({
          exact: "selected-logic",
          partial: "not-selected-logic"
        });
      }

      case "partial": {
        if (inputRef && inputRef.current) {
          formik.setFieldValue(fieldName, "partial");
          inputRef.current.value = "partial";
        }
        return setBackClassName({
          exact: "not-selected-logic",
          partial: "selected-logic"
        });
      }
    }
  }

  return (
    <FieldWrapper {...queryLogicSwitchProps}>
      {({ formik, value }) => (
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
            className={`${backClassName.exact} py-2 px-3 exactSpan`}
            onClick={() =>
              onSwitchClicked("exact", queryLogicSwitchProps.name, formik)
            }
            style={{
              borderRadius: "5px 0 0 5px",
              borderRight: "1px",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "Exact" })}
          </span>
          <span
            className={`${backClassName.partial} py-2 px-3 partialSpan`}
            onClick={() =>
              onSwitchClicked("partial", queryLogicSwitchProps.name, formik)
            }
            style={{
              borderRadius: "0 5px 5px 0",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "Partial" })}
          </span>
          <input
            name={queryLogicSwitchProps.name}
            value={value}
            type="hidden"
            ref={inputRef}
          />
        </div>
      )}
    </FieldWrapper>
  );
}

/**
 * Using the query row for a text search, generate the elastic search request to be made.
 *
 * @param builder The elastic search bodybuilder object.
 * @param queryRow The query row to be used.
 */
export function transformTextSearchToDSL(
  queryRow: QueryRowExportProps
): ElasticSearchQueryParams[] {
  const { matchType, textMatchType, matchValue } = queryRow;

  switch (matchType) {
    // Equals match type.
    case "equals":
      if (textMatchType === "partial") {
        return [
          { queryOperator: "must", queryType: "match", value: matchValue }
        ];
      } else {
        return [
          { queryOperator: "must", queryType: "term", value: matchValue }
        ];
      }

    // Not equals match type.
    case "notEquals":
      return [
        { queryOperator: "must_not", queryType: "term", value: matchValue },
        { queryOperator: "must", queryType: "exists" }
      ];

    // Empty values only. (only if the value is not mandatory)
    case "empty":
      return [
        { queryOperator: "must", queryType: "exists" },
        { queryOperator: "must", queryType: "term", value: "" }
      ];

    // Not empty values only. (only if the value is not mandatory)
    case "notEmpty":
      return [
        { queryOperator: "must", queryType: "exists" },
        { queryOperator: "must_not", queryType: "term", value: "" },
        { queryOperator: "must_not", queryType: "term", value: "NULL" }
      ];

    // Default case
    default:
      return [{ queryOperator: "must", queryType: "match", value: matchValue }];
  }
}
