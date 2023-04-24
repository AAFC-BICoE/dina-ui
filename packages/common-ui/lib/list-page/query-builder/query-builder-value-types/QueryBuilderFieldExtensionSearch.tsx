import { useEffect, useState } from "react";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import QueryBuilderTextSearch from "./QueryBuilderTextSearch";
import Select from "react-select";
import { useIntl } from "react-intl";
import { useQuery } from "common-ui";
import { FieldExtension } from "../../../../../dina-ui/types/collection-api/resources/FieldExtension";

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

export interface FieldExtensionOption {
  label: string;
  value: string;
}

export interface FieldExtensionPackageOption {
  label: string;
  value: string;
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

  /** Operator to be used on the field extension search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

export default function QueryRowFieldExtensionSearch({
  value,
  setValue,
  fieldExtensionConfig
}: QueryRowTextSearchProps) {
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

  const [extensionOptions, setExtensionOptions] = useState<
    FieldExtensionPackageOption[]
  >([]);
  const [extensionSearchValue, setExtensionSearchValue] = useState<string>("");

  const [fieldOptions, setFieldOptions] = useState<FieldExtensionOption[]>([]);
  const [fieldSearchValue, setFieldSearchValue] = useState<string>("");

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

  // If component is provided, add a filter for it.
  useQuery<FieldExtension[]>(
    {
      path: fieldExtensionConfig?.dynamicField?.apiEndpoint ?? "",
      filter: {
        // "extension.name": `*${extensionSearchValue}*`,
        "extension.fields.dinaComponent":
          fieldExtensionConfig?.dynamicField?.component ?? ""
      }
    },
    {
      onSuccess: ({ data }) => {
        setExtensionOptions(
          data.map<FieldExtensionPackageOption>((fieldExtension) => ({
            label: fieldExtension?.extension?.name ?? "",
            value: fieldExtension?.extension?.key ?? ""
          }))
        );
      },
      disabled: fieldExtensionConfig?.dynamicField === undefined
    }
  );

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

  const selectedExtension = extensionOptions?.find(
    (fieldExtensionPackage) =>
      fieldExtensionPackage.value === fieldExtensionState.selectedExtension
  );

  const selectedField = fieldOptions?.find(
    (fieldExtension) =>
      fieldExtension.value === fieldExtensionState.selectedField
  );

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === fieldExtensionState.selectedOperator
  );

  return (
    <div className="row">
      {/* Extension Selector */}
      <Select<FieldExtensionPackageOption>
        options={extensionOptions}
        className={`col me-2 ms-2 ps-0`}
        value={selectedExtension}
        placeholder={"Select field extension package to search against..."}
        onChange={(selected) =>
          setFieldExtensionState({
            ...fieldExtensionState,
            selectedExtension: selected?.value ?? "",
            selectedField: ""
          })
        }
        onInputChange={(inputValue) => setExtensionSearchValue(inputValue)}
        inputValue={extensionSearchValue}
      />

      {/* Field Selector */}
      <Select<FieldExtensionOption>
        options={fieldOptions}
        className={`col me-2 ms-2 ps-0`}
        value={selectedField}
        placeholder={"Select field extension to search against..."}
        onChange={(selected) =>
          setFieldExtensionState({
            ...fieldExtensionState,
            selectedField: selected?.value ?? ""
          })
        }
        onInputChange={(inputValue) => setFieldSearchValue(inputValue)}
        inputValue={fieldSearchValue}
      />

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
 * Using the query row for a field extension search, generate the elastic search request to be
 * made.
 */
export function transformFieldExtensionToDSL({}: //  value,
//  fieldInfo
TransformToDSLProps): any {
  return undefined;
}
