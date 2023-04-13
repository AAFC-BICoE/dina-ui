import React, { useState } from "react";
import {
  includedTypeQuery,
  matchQuery,
  termQuery,
  existsQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { TransformToDSLProps } from "../../types";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";

interface QueryRowTextSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
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
  setValue
}: QueryRowTextSearchProps) {
  const { formatMessage } = useIntl();

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

  return (
    <div className="d-flex">
      {/* Managed Attribute Selection */}
      <Select
        options={[]}
        className={`flex-grow-1 me-2 ps-0`}
        value={value}
        onChange={(selected) => setValue?.("")}
      />

      {/* Operator */}
      <Select
        options={[]}
        className={`flex-grow-1 me-2 ps-0`}
        value={value}
        onChange={(selected) => setValue?.("")}
      />
    </div>
  );
}

/**
 * Using the query row for a text search, generate the elastic search request to be made.
 */
export function transformManagedAttributeToDSL({}: TransformToDSLProps): any {
  return "work in progress";
}
