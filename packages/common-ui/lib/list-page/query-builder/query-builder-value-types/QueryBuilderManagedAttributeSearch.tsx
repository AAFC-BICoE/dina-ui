import React, { useState } from "react";
import { TransformToDSLProps, ESIndexMapping } from "../../types";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import { SelectOption, useQuery } from "common-ui";
import { ManagedAttribute } from "../../../../../dina-ui/types/collection-api";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL
} from "./QueryBuilderNumberSearch";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL
} from "./QueryBuilderDateSearch";
import QueryBuilderBooleanSearch from "./QueryBuilderBooleanSearch";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "./QueryBuilderTextSearch";

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
   * Managed attribute field settings. This is passed to the QueryPage from the Dynamic Mapping
   * config and will be used to determine what endpoint to use to retrieve the managed attributes.
   */
  managedAttributeConfig?: ESIndexMapping;
}

export interface ManagedAttributeOption extends SelectOption<string> {
  type: string;
  acceptedValues?: string[] | null;
}

export interface ManagedAttributeSearchStates {
  /** The key of the selected managed attribute to search against. */
  selectedManagedAttribute: string;

  /** The type of the selected managed attribute. */
  selectedType: string;

  /** Operator to be used on the managed attribute search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

export default function QueryRowManagedAttributeSearch({
  value,
  setValue,
  managedAttributeConfig
}: QueryRowTextSearchProps) {
  const { formatMessage } = useIntl();

  const [managedAttributeSearchValue, setManagedAttributeSearchValue] =
    useState<string>("");

  const [managedAttributeOptions, setManagedAttributeOptions] =
    useState<ManagedAttributeOption[]>();

  const [managedAttributeState, setManagedAttributeState] =
    useState<ManagedAttributeSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            searchValue: "",
            selectedOperator: "",
            selectedManagedAttribute: "",
            selectedType: ""
          }
    );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(managedAttributeState));
    }
  }, [managedAttributeState, setValue]);

  // Convert a value from Query Builder into the Managed Attribute State in this component.
  useEffect(() => {
    if (value) {
      setManagedAttributeState(JSON.parse(value));
    }
  }, [value]);

  // If component is provided, add a filter for it.
  const query = useQuery<ManagedAttribute[]>(
    {
      path: managedAttributeConfig?.dynamicField?.apiEndpoint ?? "",
      filter: {
        rsql:
          `name==*${managedAttributeSearchValue}*` +
          (managedAttributeConfig?.dynamicField?.component
            ? `;managedAttributeComponent==${managedAttributeConfig.dynamicField.component}`
            : "")
      }
    },
    {
      onSuccess: ({ data }) => {
        setManagedAttributeOptions(
          data.map<ManagedAttributeOption>((managedAttribute) => ({
            label: managedAttribute.name,
            value: managedAttribute.key,
            type: managedAttribute.vocabularyElementType,
            acceptedValues: managedAttribute.acceptedValues
          }))
        );
      },
      disabled: managedAttributeConfig?.dynamicField === undefined
    }
  );

  const managedAttributeSelected = managedAttributeOptions?.find(
    (managedAttribute) =>
      managedAttribute.value === managedAttributeState.selectedManagedAttribute
  );

  // Determine the type of the selected managed attribute.
  const managedAttributeType = managedAttributeSelected?.acceptedValues
    ? "PICK_LIST"
    : managedAttributeSelected?.type ?? "";

  const supportedOperatorsForType: (type: string) => string[] = (type) => {
    switch (type) {
      case "INTEGER":
      case "DECIMAL":
        return [
          "equals",
          "notEquals",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ];
      case "DATE":
        return [
          "equals",
          "notEquals",
          "containsDate",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ];
      case "PICK_LIST":
        return ["equals", "notEquals", "empty", "notEmpty"];
      case "BOOL":
        return ["equals", "empty", "notEmpty"];
      case "STRING":
        return ["exactMatch", "partialMatch", "notEquals", "empty", "notEmpty"];
      default:
        return [];
    }
  };

  // Generate the operator options
  const operatorOptions = supportedOperatorsForType(managedAttributeType).map<
    SelectOption<string>
  >((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === managedAttributeState.selectedOperator
  );

  // Determine the value input to display based on the type.
  const supportedValueForType = (type: string) => {
    const commonProps = {
      matchType: managedAttributeState.selectedOperator,
      value: managedAttributeState.searchValue,
      setValue: (userInput) =>
        setManagedAttributeState({
          ...managedAttributeState,
          searchValue: userInput ?? ""
        })
    };
    switch (type) {
      case "INTEGER":
      case "DECIMAL":
        return <QueryBuilderNumberSearch {...commonProps} />;
      case "DATE":
        return <QueryBuilderDateSearch {...commonProps} />;
      case "PICK_LIST":
        const pickListOptions =
          managedAttributeSelected?.acceptedValues?.map((pickOption) => ({
            value: pickOption,
            label: pickOption
          })) ?? [];
        return (
          <Select
            options={pickListOptions}
            className={`col ps-0`}
            value={pickListOptions?.find(
              (pickOption) =>
                pickOption.value === managedAttributeState.searchValue
            )}
            placeholder={formatMessage({
              id: "queryBuilder_pickList_placeholder"
            })}
            onChange={(pickListOption) =>
              setManagedAttributeState({
                ...managedAttributeState,
                searchValue: pickListOption?.value ?? ""
              })
            }
            isLoading={query.loading}
          />
        );
      case "BOOL":
        // Automatically set the boolean value to true if it's not preset.
        if (
          managedAttributeState.searchValue !== "true" &&
          managedAttributeState.searchValue !== "false"
        ) {
          setManagedAttributeState({
            ...managedAttributeState,
            searchValue: "true"
          });
        }
        return <QueryBuilderBooleanSearch {...commonProps} />;
      case "STRING":
        return <QueryBuilderTextSearch {...commonProps} />;
      default:
        return <></>;
    }
  };

  // Set the type and the operator if the managed attribute selected has changed.
  if (
    managedAttributeState.selectedType === "" &&
    managedAttributeType !== ""
  ) {
    setManagedAttributeState({
      ...managedAttributeState,
      selectedType: managedAttributeType
    });
  }
  if (!selectedOperator && operatorOptions?.[0]) {
    setManagedAttributeState({
      ...managedAttributeState,
      selectedOperator: operatorOptions?.[0]?.value ?? ""
    });
  }

  return (
    <div className="row">
      {/* Managed Attribute Selection */}
      <Select<ManagedAttributeOption>
        options={managedAttributeOptions}
        className={`col me-1 ms-2 ps-0`}
        value={managedAttributeSelected}
        placeholder={formatMessage({
          id: "queryBuilder_managedAttribute_placeholder"
        })}
        onChange={(selected) =>
          setManagedAttributeState({
            ...managedAttributeState,
            selectedManagedAttribute: selected?.value ?? "",
            selectedOperator: "",
            selectedType: "",
            searchValue: ""
          })
        }
        onInputChange={(inputValue) =>
          setManagedAttributeSearchValue(inputValue)
        }
        inputValue={managedAttributeSearchValue}
      />

      {/* Operator */}
      {operatorOptions.length !== 0 ? (
        <Select<SelectOption<string>>
          options={operatorOptions}
          className={`col me-1 ps-0`}
          value={selectedOperator}
          onChange={(selected) =>
            setManagedAttributeState({
              ...managedAttributeState,
              selectedOperator: selected?.value ?? ""
            })
          }
        />
      ) : (
        <></>
      )}

      {/* Value Searching (changes based ont he type selected) */}
      <div className="col ps-0">
        {supportedValueForType(managedAttributeType)}
      </div>
    </div>
  );
}

/**
 * Using the query row for a managed attribute search, generate the elastic search request to be
 * made.
 */
export function transformManagedAttributeToDSL({
  value,
  fieldInfo
}: TransformToDSLProps): any {
  // Parse the managed attribute search options. Trim the search value.
  const managedAttributeSearchValue: ManagedAttributeSearchStates =
    JSON.parse(value);
  managedAttributeSearchValue.searchValue =
    managedAttributeSearchValue.searchValue.trim();

  if (!managedAttributeSearchValue.searchValue) {
    return undefined;
  }

  const commonProps = {
    fieldPath:
      fieldInfo?.path +
      "." +
      managedAttributeSearchValue.selectedManagedAttribute,
    operation: managedAttributeSearchValue.selectedOperator,
    queryType: "",
    value: managedAttributeSearchValue.searchValue,
    fieldInfo: {
      ...fieldInfo,
      distinctTerm: true
    } as ESIndexMapping
  };

  switch (managedAttributeSearchValue.selectedType) {
    case "INTEGER":
    case "DECIMAL":
      return transformNumberSearchToDSL({ ...commonProps });
    case "DATE":
      return transformDateSearchToDSL({ ...commonProps });
    case "PICK_LIST":
    case "STRING":
    case "BOOL":
      return transformTextSearchToDSL({ ...commonProps });
  }

  throw new Error(
    "Unsupported managed attribute type: " +
      managedAttributeSearchValue.selectedType
  );
}
