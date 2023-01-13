import {
  filterBy,
  ResourceSelectField,
  SelectField,
  TextField
} from "common-ui";
import { FaPlus, FaMinus } from "react-icons/fa";

export function getFieldName(
  fieldArrayName: string,
  fieldName: string,
  index: number
) {
  return `${fieldArrayName}[${index}].${fieldName}`;
}

export interface DataRowProps {
  name: string;
  rowIndex: number;
  readOnly: boolean;
  showPlusIcon?: boolean;
  addRow?: () => void;
  removeRow?: (index) => void;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
  typeOptions: any[];
}

export function DataRow({
  rowIndex,
  addRow,
  removeRow,
  name,
  showPlusIcon,
  readOnly,
  unitsOptions,
  typeOptions
}: DataRowProps) {
  const valueTextFieldName = getFieldName(name, "value", rowIndex);
  const typeSelectFieldName = getFieldName(name, "type", rowIndex);
  const unitSelectFieldName = getFieldName(name, "unit", rowIndex);
  return (
    <div className="d-flex">
      <div style={{ width: "15rem", marginLeft: "17rem" }}>
        <SelectField
          options={typeOptions}
          name={typeSelectFieldName}
          removeBottomMargin={true}
          removeLabel={true}
        />
      </div>
      <div style={{ width: "15rem", marginLeft: "3rem" }}>
        <TextField
          name={valueTextFieldName}
          removeBottomMargin={true}
          removeLabel={true}
        />
      </div>

      {unitsOptions && (
        <div style={{ width: "15rem", marginLeft: "3rem" }}>
          <SelectField
            options={unitsOptions}
            name={unitSelectFieldName}
            removeBottomMargin={true}
            removeLabel={true}
          />
        </div>
      )}
      {!readOnly &&
        (rowIndex === 0 && showPlusIcon ? (
          <>
            {
              <FaPlus
                className="ms-1"
                onClick={addRow as any}
                size="2em"
                style={{ cursor: "pointer", marginTop: "0.20rem" }}
                name={getFieldName(name, "addRow", rowIndex)}
              />
            }
          </>
        ) : (
          <FaMinus
            className="ms-1"
            onClick={() => removeRow?.(rowIndex)}
            size="2em"
            style={{ cursor: "pointer", marginTop: "0.20rem" }}
            name={getFieldName(name, "removeRow", rowIndex)}
          />
        ))}
    </div>
  );
}
