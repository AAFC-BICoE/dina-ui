import { useIntl } from "react-intl";
import { useState } from "react";
import { FieldWrapper } from "../formik-connected/FieldWrapper";

export function QueryLogicSwitch(queryLogicSwitchProps) {
  const { formatMessage } = useIntl();
  const [backClassName, setBackClassName] = useState({
    and: "selected-logic",
    or: "not-selected-logic"
  });

  function onSwitchClicked(name) {
    switch (name) {
      case "and":
        return setBackClassName({
          and: "selected-logic",
          or: "not-selected-logic"
        });

      case "or":
        return setBackClassName({
          or: "selected-logic",
          and: "not-selected-logic"
        });
    }
  }
  return (
    <FieldWrapper {...queryLogicSwitchProps}>
      {() => (
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
            className={`${backClassName.and} pt-1 px-3`}
            onClick={() => onSwitchClicked("and")}
            style={{
              borderRadius: "4px 0 0 4px",
              borderRight: "1px",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "AND" })}
          </span>
          <span
            className={`${backClassName.or} pt-1 px-3`}
            onClick={() => onSwitchClicked("or")}
            style={{
              borderRadius: "0 4px 4px 0",
              cursor: "pointer"
            }}
          >
            {formatMessage({ id: "OR" })}
          </span>
        </div>
      )}
    </FieldWrapper>
  );
}
