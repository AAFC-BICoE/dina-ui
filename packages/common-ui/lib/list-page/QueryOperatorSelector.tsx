import Select from "react-select";
import { useState } from "react";
import { FieldItems } from "react-awesome-query-builder";

interface QueryOperatorSelectorProps {
  options?: FieldItems;

  /**
   * Pass the selected option to the Query Builder.
   */
  setField: ((fieldPath: string) => void) | undefined;
}

interface QueryOperationOption {
  label: string;
  value: string;
}

export function QueryOperatorSelector({
  options,
  setField
}: QueryOperatorSelectorProps) {
  const [selectedOperator, setSelectedOperator] = useState<
    QueryOperationOption | undefined
  >();

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
    value: option.path ?? ""
  }));

  return (
    <div style={{ width: "100%" }}>
      <Select<QueryOperationOption>
        options={operationOptions}
        className={`flex-grow-1 me-2 ps-0`}
        styles={customStyles}
        value={selectedOperator}
        onChange={(newValue) => {
          setSelectedOperator(newValue as QueryOperationOption);
          setField?.(newValue?.value ?? "");
        }}
      />
    </div>
  );
}
