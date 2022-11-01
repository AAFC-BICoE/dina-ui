import { DinaMessage } from "../../../../../dina-ui/intl/dina-ui-intl";
import Button from "react-bootstrap/Button";

interface QueryConjunctionSwitchProps {
  currentConjunction?: string;
  setConjunction?: (conjunction: string) => void;
}

export function QueryConjunctionSwitch({
  currentConjunction,
  setConjunction
}: QueryConjunctionSwitchProps) {
  return (
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
          <DinaMessage id="queryBuilder_conjunction_and" />
        </Button>
        <Button
          className={
            currentConjunction === "OR"
              ? "toggleButton activeToggle"
              : "toggleButton"
          }
          onClick={(_) => setConjunction?.("OR")}
        >
          <DinaMessage id="queryBuilder_conjunction_or" />
        </Button>
      </div>
    </>
  );
}
