import { TextField } from "common-ui";
import { FaPlus, FaMinus } from "react-icons/fa";

export function getFieldName(
  fieldArrayName: string,
  fieldName: string,
  index: number
) {
  return `${fieldArrayName}[${index}].${fieldName}`;
}

export interface StepRowProps {
  name: string;
  index: number;
  readOnly: boolean;
  showPlusIcon?: boolean;
  addRow?: () => void;
  removeRow?: (index) => void;
}

export function StepRow({
  index,
  addRow,
  removeRow,
  name,
  showPlusIcon,
  readOnly
}: StepRowProps) {
  const textFieldName = getFieldName(name, "step", index);
  return (
    <div className="d-flex">
      <TextField name={textFieldName} customName={`Step${index + 1}`} />
      {!readOnly &&
        (index === 0 && showPlusIcon ? (
          <>
            {
              <FaPlus
                className="ms-1"
                onClick={addRow as any}
                size="2em"
                style={{ cursor: "pointer", marginTop: "2rem" }}
                name={getFieldName(name, "addRow", index)}
              />
            }
          </>
        ) : (
          <FaMinus
            className="ms-1"
            onClick={() => removeRow?.(index)}
            size="2em"
            style={{ cursor: "pointer", marginTop: "2rem" }}
            name={getFieldName(name, "removeRow", index)}
          />
        ))}
    </div>
  );
}
