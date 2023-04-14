import React, { useState } from "react";
import {
  includedTypeQuery,
  matchQuery,
  termQuery,
  existsQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { TransformToDSLProps, ESIndexMapping } from "../../types";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import { LoadingSpinner, useQuery } from "common-ui";
import { ManagedAttribute } from "../../../../../dina-ui/types/collection-api";
import QueryBuilderNumberSearch from "./QueryBuilderNumberSearch";

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

export interface ManagedAttributeOption {
  label: string;
  value: string;
  type: string;
  acceptedValues?: string[] | null;
}

export interface ManagedAttributeOperatorOption {
  label: string;
  value: string;
}

export interface ManagedAttributeSearchStates {
  /** UUID of the selected managed attribute to search against. */
  selectedManagedAttribute: string;

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

  const [managedAttributeOptions, setManagedAttributeOptions] =
    useState<ManagedAttributeOption[]>();

  const [managedAttributeState, setManagedAttributeState] =
    useState<ManagedAttributeSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            searchValue: "",
            selectedOperator: "",
            selectedManagedAttribute: ""
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
  const filter = managedAttributeConfig?.dynamicField?.component
    ? {
        managedAttributeComponent: managedAttributeConfig.dynamicField.component
      }
    : undefined;
  const query = useQuery<ManagedAttribute[]>(
    {
      path: managedAttributeConfig?.dynamicField?.apiEndpoint ?? "",
      filter
    },
    {
      onSuccess: ({ data }) => {
        setManagedAttributeOptions(
          data.map<ManagedAttributeOption>((managedAttribute) => ({
            label: managedAttribute.name,
            value: managedAttribute.id,
            type: managedAttribute.vocabularyElementType,
            acceptedValues: managedAttribute.acceptedValues
          }))
        );
      },
      disabled: managedAttributeConfig?.dynamicField === undefined
    }
  );

  // Determine the type of the selected managed attribute.
  const managedAttributeType =
    managedAttributeOptions?.find(
      (managedAttribute) =>
        managedAttribute.value ===
        managedAttributeState.selectedManagedAttribute
    )?.type ?? "";

  const supportedOperatorsForType: (type: string) => string[] = (type) => {
    switch (type) {
      case "INTEGER":
      case "DECIMAL":
      case "DATE":
        return [
          "equals",
          "notEquals",
          "greaterThan",
          "greaterThanOrEqual",
          "lessThan",
          "lessThanOrEqual",
          "empty",
          "notEmpty"
        ];
      case "PICK_LIST":
        return ["equals", "notEquals", "empty", "notEmpty"];
      case "BOOL":
        return ["equals"];
      case "STRING":
        return ["exactMatch", "partialMatch", "notEquals", "empty", "notEmpty"];
      default:
        return [];
    }
  };

  // Generate the operator options
  const operatorOptions = supportedOperatorsForType(
    managedAttributeType
  ).map<ManagedAttributeOperatorOption>((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Determine the value input to display based on the type.
  const supportedValueForType = (type: string) => {
    switch (type) {
      case "INTEGER":
      case "DECIMAL":
        return (
          <QueryBuilderNumberSearch
            matchType={managedAttributeState.selectedOperator}
            value={managedAttributeState.searchValue}
            setValue={(numberValue) =>
              setManagedAttributeState({
                ...managedAttributeState,
                searchValue: numberValue ?? ""
              })
            }
          />
        );
      default:
        return <></>;
    }
  };

  // If loading, just render a spinner.
  if (query.loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div className="d-flex">
      {/* Managed Attribute Selection */}
      <Select<ManagedAttributeOption>
        options={managedAttributeOptions}
        className={`flex-grow-1 me-2 ps-0`}
        value={managedAttributeOptions?.find(
          (managedAttribute) =>
            managedAttribute.value ===
            managedAttributeState.selectedManagedAttribute
        )}
        placeholder={"Select managed attribute to search against..."}
        onChange={(selected) =>
          setManagedAttributeState({
            ...managedAttributeState,
            selectedManagedAttribute: selected?.value ?? ""
          })
        }
      />

      {/* Operator */}
      {operatorOptions.length !== 0 ? (
        <Select<ManagedAttributeOperatorOption>
          options={operatorOptions}
          className={`flex-grow-1 me-2 ps-0`}
          value={operatorOptions?.find(
            (operator) =>
              operator.value === managedAttributeState.selectedOperator
          )}
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
      <div className="flex-grow-1 ps-0">
        {supportedValueForType(managedAttributeType)}
      </div>
    </div>
  );
}

/**
 * Using the query row for a text search, generate the elastic search request to be made.
 */
export function transformManagedAttributeToDSL({}: TransformToDSLProps): any {
  return "work in progress";
}
