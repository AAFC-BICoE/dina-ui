import {
  filterBy,
  ResourceSelect,
  ResourceSelectField,
  SelectField,
  SelectOption,
  TextField
} from "common-ui";
import { FilterParam, PersistedResource, KitsuResource } from "kitsu";
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
  index: number;
  readOnly: boolean;
  showPlusIcon?: boolean;
  addRow?: () => void;
  removeRow?: (index) => void;
  /** The model type to select resources from. */
  model: string;
  unitsOptions?: any[];
}

export function DataRow({
  index,
  addRow,
  removeRow,
  name,
  showPlusIcon,
  readOnly,
  model,
  unitsOptions
}: DataRowProps) {
  const textFieldName = getFieldName(name, "step", index);
  return (
    <div className="d-flex">
      <ResourceSelectField
        filter={filterBy(["displayName"])}
        model={model}
        optionLabel={(person) => person.id}
        name={""}
      />
      <TextField name={textFieldName} customName={`Step${index + 1}`} />
      {unitsOptions && <SelectField options={unitsOptions} name={""} />}
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
