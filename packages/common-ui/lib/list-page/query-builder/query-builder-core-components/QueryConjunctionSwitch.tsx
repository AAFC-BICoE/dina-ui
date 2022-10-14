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
        AND
      </Button>
      <Button
        variant={currentConjunction === "OR" ? "primary" : "outline-primary"}
        onClick={(_) => setConjunction?.("OR")}
      >
        OR
      </Button>
    </ButtonGroup>
  );
}
