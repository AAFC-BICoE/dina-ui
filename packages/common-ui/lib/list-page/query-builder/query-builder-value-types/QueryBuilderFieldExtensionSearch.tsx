import { useEffect, useState } from "react";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import QueryBuilderTextSearch from "./QueryBuilderTextSearch";
import Select from "react-select";
import { useIntl } from "react-intl";

interface QueryRowTextSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * Field extension field settings. This is passed to the QueryPage from the Dynamic Mapping
   * config and will be used to determine what endpoint to use to retrieve the field extensions.
   */
  fieldExtensionConfig?: ESIndexMapping;
}

export interface FieldExtensionOperatorOption {
  label: string;
  value: string;
}

export interface FieldExtensionSearchStates {
  /** The extension package to be used. */
  selectedExtension: string;

  /** The selected extension field to be used. */
  selectedField: string;

  /** Operator to be used on the managed attribute search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

export default function QueryRowFieldExtensionSearch({
  value,
  setValue
}: //  fieldExtensionConfig
QueryRowTextSearchProps) {
  const { formatMessage } = useIntl();

  const [fieldExtensionState, setFieldExtensionState] =
    useState<FieldExtensionSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            selectedExtension: "",
            selectedField: "",
            selectedOperator: "",
            searchValue: ""
          }
    );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(fieldExtensionState));
    }
  }, [fieldExtensionState, setValue]);

  // Convert a value from Query Builder into the Field Extension State in this component.
  useEffect(() => {
    if (value) {
      setFieldExtensionState(JSON.parse(value));
    }
  }, [value]);

  // Generate the operator options
  const operatorOptions = [
    "exactMatch",
    "partialMatch",
    "notEquals",
    "empty",
    "notEmpty"
  ].map<FieldExtensionOperatorOption>((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === fieldExtensionState.selectedOperator
  );

  return (
    <div className="row">
      {/* Extension Package Selector */}

      {/* Field Extension Selector */}

      {/* Operator Selector */}
      <Select<FieldExtensionOperatorOption>
        options={operatorOptions}
        className={`col me-2 ps-0`}
        value={selectedOperator}
        onChange={(selected) =>
          setFieldExtensionState({
            ...fieldExtensionState,
            selectedOperator: selected?.value ?? ""
          })
        }
      />

      {/* Search Value */}
      <div className="col ps-0">
        <QueryBuilderTextSearch
          matchType={fieldExtensionState.selectedOperator}
          value={fieldExtensionState.searchValue}
          setValue={(userInput) =>
            setFieldExtensionState({
              ...fieldExtensionState,
              searchValue: userInput ?? ""
            })
          }
        />
      </div>
    </div>
  );
}

/**
 * Using the query row for a managed attribute search, generate the elastic search request to be
 * made.
 */
export function transformFieldExtensionToDSL({}: //  value,
//  fieldInfo
TransformToDSLProps): any {
  return undefined;
}
