import { DinaMessage } from "../../../../../dina-ui/intl/dina-ui-intl";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

interface QueryConjunctionSwitchProps {
  currentConjunction?: string;

  setConjunction?: (conjunction: string) => void;
}

export function QueryConjunctionSwitch({
  currentConjunction,
  setConjunction
}: QueryConjunctionSwitchProps) {
  return (
    <ButtonGroup className="mb-1">
      <Button
        variant={currentConjunction === "AND" ? "primary" : "outline-primary"}
        onClick={(_) => setConjunction?.("AND")}
      >
        <DinaMessage id="queryBuilder_conjunction_and" />
      </Button>
      <Button
        variant={currentConjunction === "OR" ? "primary" : "outline-primary"}
        onClick={(_) => setConjunction?.("OR")}
      >
        <DinaMessage id="queryBuilder_conjunction_or" />
      </Button>
    </ButtonGroup>
  );
}
