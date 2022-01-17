import { useIntl } from "react-intl";
import { useRef, useState } from "react";
import { FieldWrapper } from "../formik-connected/FieldWrapper";

export function QueryLogicSwitchField(queryLogicSwitchProps) {
  const { formatMessage } = useIntl();
  const [backClassName, setBackClassName] = useState({
    and: "selected-logic",
    or: "not-selected-logic"
  });

  const inputRef = useRef<HTMLInputElement>(null);

  function onSwitchClicked(logicName, fieldName, formik) {
    switch (logicName) {
      case "and": {
        if (inputRef && inputRef.current) {
          formik.setFieldValue(fieldName, "and");
        }
        return setBackClassName({
          and: "selected-logic",
          or: "not-selected-logic"
        });
      }

      case "or": {
        if (inputRef && inputRef.current) {
          formik.setFieldValue(fieldName, "or");
          inputRef.current.value = "or";
        }
        return setBackClassName({
          or: "selected-logic",
          and: "not-selected-logic"
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
            borderWidth: "1px",
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
            className={`${backClassName.and} pt-1 px-3 andSpan`}
            onClick={() =>
              onSwitchClicked("and", queryLogicSwitchProps.name, formik)
            }
            style={{
              borderRadius: "4px 0 0 4px",
              borderRight: "1px",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "AND" })}
          </span>
          <span
            className={`${backClassName.or} pt-1 px-3 orSpan`}
            onClick={() =>
              onSwitchClicked("or", queryLogicSwitchProps.name, formik)
            }
            style={{
              borderRadius: "0 4px 4px 0",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "OR" })}
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
