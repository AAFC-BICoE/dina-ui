import {
  filterBy,
  ResourceSelectField,
  SelectField,
  TextField,
} from "common-ui";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
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
  showPlusIcon?: boolean;
  addRow?: () => void;
  removeRow?: (index) => void;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
  typeOptions?: any[];
  readOnly?: boolean;
}

export function DataRow({
  rowIndex,
  addRow,
  removeRow,
  name,
  showPlusIcon,
  unitsOptions,
  typeOptions,
  readOnly,
}: DataRowProps) {
  const valueTextFieldName = getFieldName(name, "value", rowIndex);
  const typeSelectFieldName = getFieldName(name, "type", rowIndex);
  const unitSelectFieldName = getFieldName(name, "unit", rowIndex);
  return (
    <div className="d-flex">
      {typeOptions && (
        <div style={{ width: "15rem", marginLeft: "17rem" }}>
          <SelectField
            options={typeOptions}
            name={typeSelectFieldName}
            label={<DinaMessage id="dataType" />}
            removeBottomMargin={true}
          />
        </div>
      )}
      <div style={{ width: "15rem", marginLeft: "3rem" }}>
        <TextField
          name={valueTextFieldName}
          removeBottomMargin={true}
          label={<DinaMessage id="dataValue" />}
        />
      </div>
      {unitsOptions && (
        <div style={{ width: "15rem", marginLeft: "3rem" }}>
          <SelectField
            options={unitsOptions}
            name={unitSelectFieldName}
            removeBottomMargin={true}
            label={<DinaMessage id="unit" />}
          />
        </div>
      )}
      {!readOnly && (
        <div style={{ cursor: "pointer", marginTop: "2rem" }}>
          {rowIndex === 0 && showPlusIcon ? (
            <>
              {
                <FaPlus
                  className="ms-1"
                  onClick={addRow as any}
                  size="2em"
                  name={getFieldName(name, "addRow", rowIndex)}
                />
              }
            </>
          ) : (
            <FaMinus
              className="ms-1"
              onClick={() => removeRow?.(rowIndex)}
              size="2em"
              name={getFieldName(name, "removeRow", rowIndex)}
            />
          )}
        </div>
      )}
    </div>
  );
}
