import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export type TextOptions = "exact" | "partial";

interface QueryTextSwitchProps {
  currentTextOption?: TextOptions;

  setTextOption?: (textOption: TextOptions) => void;
}

export function QueryTextSwitch({
  currentTextOption,
  setTextOption
}: QueryTextSwitchProps) {
  return (
    <ButtonGroup>
      <Button
        variant={currentTextOption === "exact" ? "primary" : "outline-primary"}
        onClick={(_) => setTextOption?.("exact")}
        style={{ borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px" }}
      >
        Exact
      </Button>
      <Button
        variant={
          currentTextOption === "partial" ? "primary" : "outline-primary"
        }
        onClick={(_) => setTextOption?.("partial")}
      >
        Partial
      </Button>
    </ButtonGroup>
  );
}
