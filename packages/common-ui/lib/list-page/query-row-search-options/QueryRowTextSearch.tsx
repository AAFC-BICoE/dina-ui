import React, { useRef, useState } from "react";
import { FieldSpy, FieldWrapper, TextField } from "../..";
import { SelectField } from "../../formik-connected/SelectField";
import { fieldProps } from "../QueryRow";
import { useIntl } from "react-intl";

/**
 * The match options when a text search is being performed.
 *
 * Empty and Not Empty can be used if the text value is not mandatory.
 */
const queryRowMatchOptions = [
  { label: "Equals", value: "equals" },
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
            <TextField
              name={fieldProps(queryBuilderName, "matchValue", index)}
              className="me-1 flex-fill"
              removeLabel={true}
              readOnly={matchType === "empty" || matchType === "notEmpty"}
            />

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
          exact: "selected-logic",
          partial: "not-selected-logic"
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
            height: "2.2em",
            borderColor: "#DCDCDC",
            borderStyle: "solid",
            borderWidth: "0px",
            borderRadius: "4px"
          }}
        >
          <style>
            {`
              .selected-logic {
                background-color: #0074d9;
              }       
              .not-selected-logic {
                background-color: #DCDCDC;
              }                  
            `}
          </style>
          <span
            className={`${backClassName.exact} pt-1 px-3 exactSpan`}
            onClick={() =>
              onSwitchClicked("exact", queryLogicSwitchProps.name, formik)
            }
            style={{
              borderRadius: "4px 0 0 4px",
              borderRight: "1px",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "Exact" })}
          </span>
          {/* Hide temporarily before we get more understanding how we like to proceed */}
          <span
            className={`${backClassName.partial} pt-1 px-3 partialSpan d-none`}
            onClick={() =>
              onSwitchClicked("partial", queryLogicSwitchProps.name, formik)
            }
            style={{
              borderRadius: "0 4px 4px 0",
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
