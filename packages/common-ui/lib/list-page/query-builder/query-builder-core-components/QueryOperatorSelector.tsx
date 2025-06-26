import Select from "react-select";
import { FieldItem } from "@react-awesome-query-builder/ui";
import { ESIndexMapping } from "../../types";

interface QueryOperatorSelectorProps {
  options?: FieldItem[];

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
  const handleOperatorChange = (newValue) => {
    setOperator?.(newValue?.value ?? "");
  };

  // Do not render if no operators are available, specifically the managed attributes.
  if (options?.length === 1 && options[0].key === "noOperator") {
    handleOperatorChange({ value: "noOperator" });
    return <></>;
  }

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
      // Only display the exact match option if keyword support exist.
      if (
        (option.key === "exactMatch" || option.key === "notEquals") &&
        !selectedFieldMapping?.keywordMultiFieldSupport
      ) {
        return false;
      }

      // Only display the infix option if it is supported in the mapping.
      if (
        option.key === "containsText" &&
        !selectedFieldMapping?.containsSupport
      ) {
        return false;
      }

      // Wildcard "contains" should not be displayed if optimized infix exists.
      // Or if the main type is keyword, it's not supported.
      if (
        option.key === "wildcard" &&
        (selectedFieldMapping?.containsSupport ||
          selectedFieldMapping?.type === "keyword")
      ) {
        return false;
      }

      // Only display the "ends with" option if it's supported in the mapping.
      if (option.key === "endsWith" && !selectedFieldMapping?.endsWithSupport) {
        return false;
      }

      // Between for the text type should only be displayed if numeric keyword exists.
      if (
        option.key === "between" &&
        selectedFieldMapping?.type === "text" &&
        !selectedFieldMapping?.keywordNumericSupport
      ) {
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
        onChange={handleOperatorChange}
      />
    </div>
  );
}
