import Select from "react-select";
import { FieldItems } from "react-awesome-query-builder";

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
}

interface QueryOperationOption {
  label: string;
  value: string;
}

export function QueryOperatorSelector({
  options,
  selectedOperator,
  setOperator
}: QueryOperatorSelectorProps) {
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

  const operationOptions = options?.map<QueryOperationOption>((option) => ({
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
