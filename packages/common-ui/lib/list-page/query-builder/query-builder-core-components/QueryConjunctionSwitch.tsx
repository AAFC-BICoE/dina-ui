import { DinaMessage } from "../../../../../dina-ui/intl/dina-ui-intl";
import Button from "react-bootstrap/Button";

interface QueryConjunctionSwitchProps {
  currentConjunction?: string;
  setConjunction?: (conjunction: string) => void;
  disabled?: boolean;
}

export function QueryConjunctionSwitch({
  currentConjunction,
  setConjunction,
  disabled
}: QueryConjunctionSwitchProps) {
  return !disabled ? (
    <>
      <div className="toggleGroup">
        <Button
          className={
            currentConjunction === "AND"
              ? "toggleButton activeToggle"
              : "toggleButton"
          }
          onClick={(_) => setConjunction?.("AND")}
        >
          <span>
            <DinaMessage id="queryBuilder_conjunction_and" />
          </span>
        </Button>
        <Button
          className={
            currentConjunction === "OR"
              ? "toggleButton activeToggle"
              : "toggleButton"
          }
          onClick={(_) => setConjunction?.("OR")}
        >
          <span>
            <DinaMessage id="queryBuilder_conjunction_or" />
          </span>
        </Button>
      </div>
    </>
  ) : (
    <></>
  );
}
