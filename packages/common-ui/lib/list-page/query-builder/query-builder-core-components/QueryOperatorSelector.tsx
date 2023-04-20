import Select from "react-select";
import { FieldItems } from "react-awesome-query-builder";
import { ESIndexMapping } from "../../types";

interface QueryOperatorSelectorProps {
  options?: FieldItems;

  /**
   * Operator selected from Query Builder.
   */
  selectedOperator?: string;

  /**
   * Pass the selected option to the Query Builder.
   */
  setOperator: ((fieldPath: string) => void) | undefined;

  /**
   * Field mapping for the selected field. This can determined what options are displayed
   * to the user for the operations.
   */
  selectedFieldMapping?: ESIndexMapping;
}

interface QueryOperationOption {
  label: string;
  value: string;
}

export function QueryOperatorSelector({
  options,
  selectedOperator,
  setOperator,
  selectedFieldMapping
}: QueryOperatorSelectorProps) {
  /* istanbul ignore next */
  const customStyles = {
    placeholder: (provided, _) => ({
      ...provided,
      color: "rgb(87,120,94)"
    }),
    menu: (base) => ({ ...base, zIndex: 1050 }),
    control: (base) => ({
      ...base
    })
  };

  // Some options are displayed only if it is supported.
  const operationOptions = options
    ?.filter((option) => {
      if (option.key === "prefix" && !selectedFieldMapping?.prefixSupport) {
        return false;
      }
      if (option.key === "contains" && !selectedFieldMapping?.containsSupport) {
        return false;
      }
      if (option.key === "suffix" && !selectedFieldMapping?.suffixSupport) {
        return false;
      }
      return true;
    })
    ?.map<QueryOperationOption>((option) => ({
      label: option.label,
      value: option.key ?? ""
    }));

  const selectedOption = operationOptions?.find(
    (dropdownItem) => dropdownItem.value === selectedOperator
  );

  return (
    <div style={{ width: "100%" }}>
      <Select<QueryOperationOption>
        options={operationOptions}
        className={`flex-grow-1 me-2 ps-0`}
        styles={customStyles}
        value={selectedOption}
        onChange={(newValue) => setOperator?.(newValue?.value ?? "")}
      />
    </div>
  );
}
