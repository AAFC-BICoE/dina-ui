import React, { useState } from "react";
import { TransformToDSLProps, ESIndexMapping } from "../../types";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import { filterBy, ResourceSelect, SelectOption, useQuery } from "common-ui";
import {
  ManagedAttribute,
  VocabularyElement
} from "../../../../../dina-ui/types/collection-api";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL,
  validateNumber
} from "./QueryBuilderNumberSearch";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL,
  validateDate
} from "./QueryBuilderDateSearch";
import QueryBuilderBooleanSearch from "./QueryBuilderBooleanSearch";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "./QueryBuilderTextSearch";
import { get, noop } from "lodash";
import { PersistedResource } from "kitsu";
import { fieldValueToIndexSettings } from "../useQueryBuilderConfig";
import { ValidationResult } from "../query-builder-elastic-search/QueryBuilderElasticSearchValidator";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";

interface QueryBuilderIdentifierSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * Identifier field settings. This is passed to the QueryPage from the Dynamic Mapping
   * config and will be used to determine what endpoint to use to retrieve the identifiers.
   */
  identifierConfig?: ESIndexMapping;

  /**
   * All the possible field settings, this is for linking it to a identifier in the index map.
   */
  indexMap?: ESIndexMapping[];

  /**
   * If being used in the column selector, operators do not need to be displayed.
   */
  isInColumnSelector: boolean;
}

export interface IdentifierOption extends SelectOption<string> {
  identifier: string;
}

export interface IdentifierSearchStates {
  /** The key of the selected identifier to search against. */
  selectedIdentifier?: string;

  /** If possible, the identifier config from the index map */
  selectedIdentifierConfig?: ESIndexMapping;

  /** Operator to be used on the identifier search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

export default function QueryRowIdentifierSearch({
  value,
  setValue,
  identifierConfig,
  indexMap,
  isInColumnSelector
}: QueryBuilderIdentifierSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = isInColumnSelector ? noop : useQueryBuilderEnterToSearch();

  const [identifierState, setIdentifierState] =
    useState<IdentifierSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            searchValue: "",
            selectedOperator: "",
            selectedIdentifier: undefined,
            selectedIdentifierConfig: undefined,
            selectedType: ""
          }
    );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(identifierState));
    }
  }, [identifierState]);

  // Convert a value from Query Builder into the Identifier State in this component.
  // Dependent on the identifierConfig to indicate when it's changed.
  useEffect(() => {
    if (value) {
      setIdentifierState(JSON.parse(value));
    }
  }, [identifierConfig]);

  const identifierSelected = identifierState.selectedIdentifier;

  const supportedOperatorsForType: () => string[] = () => {
    return [
      "exactMatch",
      "wildcard",
      "in",
      "notIn",
      // Check if the identifier contains keyword numeric support.
      identifierState?.selectedIdentifierConfig?.keywordNumericSupport
        ? "between"
        : undefined,
      "startsWith",
      "notEquals",
      "empty",
      "notEmpty"
    ].filter((option) => option !== undefined) as string[];
  };

  // Generate the operator options
  const operatorOptions = supportedOperatorsForType().map<SelectOption<string>>(
    (option) => ({
      label: formatMessage({ id: "queryBuilder_operator_" + option }),
      value: option
    })
  );

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === identifierState.selectedOperator
  );

  // Determine the value input to display based on the type. Currently only string is supported.
  const supportedValueForType = () => {
    const operator = identifierState.selectedOperator;

    // If the operator is "empty" or "not empty", do not display anything.
    if (operator === "empty" || operator === "notEmpty") {
      return <></>;
    }

    const commonProps = {
      matchType: operator,
      value: identifierState.searchValue,
      setValue: (userInput) =>
        setIdentifierState({
          ...identifierState,
          searchValue: userInput ?? ""
        })
    };

    return <QueryBuilderTextSearch {...commonProps} />;
  };

  // Set the the operator if the identifier selected has changed.
  if (!selectedOperator && operatorOptions?.[0]) {
    setIdentifierState({
      ...identifierState,
      selectedOperator: operatorOptions?.[0]?.value ?? ""
    });
  }

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Identifier Selection */}
      {/* <ResourceSelect<VocabularyElement>
        filter={(input) => ({
          ...filterBy(["name"])(input),
          ...(identifierConfig?.dynamicField?.component
            ? {
                managedAttributeComponent:
                  identifierConfig?.dynamicField?.component
              }
            : {})
        })}
        model={identifierConfig?.dynamicField?.apiEndpoint ?? ""}
        optionLabel={(attribute) =>
          get(attribute, "name") ||
          get(attribute, "key") ||
          get(attribute, "id") ||
          ""
        }
        isMulti={false}
        placeholder={formatMessage({
          id: "queryBuilder_identifier_placeholder"
        })}
        pageSize={15}
        onChange={(newValue) => {
          const fieldPath =
            (identifierConfig?.path ?? "") +
            "." +
            ((newValue as PersistedResource<VocabularyElement>).key ?? "");

          setIdentifierState({
            ...identifierState,
            selectedIdentifier:
              newValue,
            selectedIdentifierConfig: fieldValueToIndexSettings(
              fieldPath,
              indexMap ?? []
            ),
            selectedOperator: "",
            selectedType: "",
            searchValue: ""
          });
        }}
        value={identifierSelected}
        selectProps={{
          controlShouldRenderValue: true,
          isClearable: false,
          className: isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0",
          onKeyDown,
          captureMenuScroll: true,
          menuPlacement: isInColumnSelector ? "bottom" : "auto",
          menuShouldScrollIntoView: false,
          minMenuHeight: 600
        }}
        omitNullOption={true}
      /> */}

      {/* Operator */}
      {!isInColumnSelector && operatorOptions.length !== 0 ? (
        <Select<SelectOption<string>>
          options={operatorOptions}
          className={`col me-1 ps-0`}
          value={selectedOperator}
          onChange={(selected) =>
            setIdentifierState({
              ...identifierState,
              selectedOperator: selected?.value ?? ""
            })
          }
          captureMenuScroll={true}
          menuPlacement={isInColumnSelector ? "bottom" : "auto"}
          menuShouldScrollIntoView={false}
          minMenuHeight={600}
        />
      ) : (
        <></>
      )}

      {/* Value Searching (changes based ont he type selected) */}
      {!isInColumnSelector && (
        <div className="col ps-0">{supportedValueForType()}</div>
      )}
    </div>
  );
}

/**
 * Using the query row for a identifier search, generate the elastic search request to be
 * made.
 */
export function transformIdentifierToDSL({
  value,
  fieldInfo,
  indexMap
}: TransformToDSLProps): any {
  // Parse the identifier search options. Trim the search value.
  let identifierSearchValue: IdentifierSearchStates;
  try {
    identifierSearchValue = JSON.parse(value);
  } catch (e) {
    console.error(e);
    return;
  }
  identifierSearchValue.searchValue = identifierSearchValue.searchValue.trim();

  if (
    identifierSearchValue.selectedOperator !== "empty" &&
    identifierSearchValue.selectedOperator !== "notEmpty"
  ) {
    if (!identifierSearchValue.searchValue) {
      return undefined;
    }
  }

  const fieldPath: string =
    fieldInfo?.path + "." + identifierSearchValue.selectedIdentifier;

  // Check if identifier can be found within the index map.
  const identifierFieldInfo = fieldValueToIndexSettings(
    fieldPath,
    indexMap ?? []
  );

  const commonProps = {
    fieldPath,
    operation: identifierSearchValue.selectedOperator,
    queryType: "",
    value: identifierSearchValue.searchValue,
    fieldInfo: identifierFieldInfo
      ? identifierFieldInfo
      : ({
          ...fieldInfo,
          distinctTerm: false,

          // All identifiers have keyword support.
          keywordMultiFieldSupport: true
        } as ESIndexMapping)
  };

  return transformTextSearchToDSL({ ...commonProps });
}