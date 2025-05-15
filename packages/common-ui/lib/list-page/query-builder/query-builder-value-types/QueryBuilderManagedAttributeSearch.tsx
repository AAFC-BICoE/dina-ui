import React, { useState } from "react";
import { TransformToDSLProps, ESIndexMapping } from "../../types";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import { filterBy, ResourceSelect, SelectOption } from "common-ui";
import { ManagedAttribute } from "../../../../../dina-ui/types/collection-api";
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

interface QueryBuilderManagedAttributeSearchProps {
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

  /**
   * All the possible field settings, this is for linking it to a managed attribute in the index map.
   */
  indexMap?: ESIndexMapping[];

  /**
   * If being used in the column selector, operators do not need to be displayed.
   */
  isInColumnSelector: boolean;
}

export interface ManagedAttributeOption extends SelectOption<string> {
  type: string;
  acceptedValues?: string[] | null;
}

export interface ManagedAttributeSearchStates {
  /** The key of the selected managed attribute to search against. */
  selectedManagedAttribute?: PersistedResource<ManagedAttribute>;

  /** If possible, the managed attribute config from the index map */
  selectedManagedAttributeConfig?: ESIndexMapping;

  /** The type of the selected managed attribute. */
  selectedType: string;

  /** Operator to be used on the managed attribute search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;

  /** UUID of a managed attribute to load in directly. Used for the query URL case. */
  preloadId?: string;
}

export default function QueryRowManagedAttributeSearch({
  value,
  setValue,
  managedAttributeConfig,
  indexMap,
  isInColumnSelector
}: QueryBuilderManagedAttributeSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = isInColumnSelector ? noop : useQueryBuilderEnterToSearch();

  const [managedAttributeState, setManagedAttributeState] =
    useState<ManagedAttributeSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            searchValue: "",
            selectedOperator: "",
            selectedManagedAttribute: undefined,
            selectedManagedAttributeConfig: undefined,
            selectedType: ""
          }
    );

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Once the menu is open, preload id should be reset since the user wants to choose
    // a different option.
    if (isMenuOpen && managedAttributeState.preloadId) {
      setManagedAttributeState((prevState) => ({
        ...prevState,
        preloadId: undefined
      }));
    }
  }, [isMenuOpen]);

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(managedAttributeState));
    }
  }, [managedAttributeState, setValue]);

  // Convert a value from Query Builder into the Managed Attribute State in this component.
  // Dependent on the managedAttributeConfig to indicate when it's changed.
  useEffect(() => {
    if (value) {
      setManagedAttributeState(JSON.parse(value));
    }
  }, [managedAttributeConfig]);

  const managedAttributeSelected =
    managedAttributeState.selectedManagedAttribute;

  // Determine the type of the selected managed attribute.
  const managedAttributeType = managedAttributeSelected?.acceptedValues
    ? "PICK_LIST"
    : managedAttributeSelected?.vocabularyElementType ?? "";

  const supportedOperatorsForType: (type: string) => string[] = (type) => {
    switch (type) {
      case "INTEGER":
      case "DECIMAL":
        return [
          "equals",
          "notEquals",
          "in",
          "notIn",
          "between",
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
          "between",
          "in",
          "notIn",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ];
      case "PICK_LIST":
        return ["equals", "notEquals", "in", "notIn", "empty", "notEmpty"];
      case "BOOL":
        return ["equals", "empty", "notEmpty"];
      case "STRING":
        return [
          "exactMatch",
          "wildcard",
          "in",
          "notIn",
          // Check if the managed attribute contains keyword numeric support.
          managedAttributeState?.selectedManagedAttributeConfig
            ?.keywordNumericSupport
            ? "between"
            : undefined,
          "startsWith",
          "notEquals",
          "empty",
          "notEmpty"
        ].filter((option) => option !== undefined) as string[];
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
    const operator = managedAttributeState.selectedOperator;

    // If the operator is "empty" or "not empty", do not display anything.
    if (operator === "empty" || operator === "notEmpty") {
      return <></>;
    }

    const commonProps = {
      matchType: operator,
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
        return operator === "in" || operator === "notIn" ? (
          <Select
            options={pickListOptions}
            className={`col ps-0`}
            value={(managedAttributeState.searchValue?.split(",") ?? []).map(
              (val) => {
                return pickListOptions.find(
                  (pickOption) => pickOption.value === val
                );
              }
            )}
            placeholder={formatMessage({
              id: "queryBuilder_pickList_multiple_placeholder"
            })}
            isMulti={true}
            onChange={(pickListOption) =>
              setManagedAttributeState({
                ...managedAttributeState,
                searchValue: (pickListOption.flat() ?? [])
                  .map((item) => item?.value ?? "")
                  .join(",")
              })
            }
            onKeyDown={onKeyDown}
          />
        ) : (
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
            onKeyDown={onKeyDown}
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
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Managed Attribute Selection */}
      <ResourceSelect<ManagedAttribute>
        filter={(input) => ({
          ...(managedAttributeState.preloadId !== undefined
            ? { uuid: managedAttributeState.preloadId } // Filter by UUID if preloadId exists
            : filterBy(["name"])(input)), // Otherwise filter by name as before
          ...(managedAttributeConfig?.dynamicField?.component
            ? {
                managedAttributeComponent:
                  managedAttributeConfig?.dynamicField?.component
              }
            : {})
        })}
        model={managedAttributeConfig?.dynamicField?.apiEndpoint ?? ""}
        optionLabel={(attribute) =>
          get(attribute, "name") ||
          get(attribute, "key") ||
          get(attribute, "id") ||
          ""
        }
        isMulti={false}
        placeholder={formatMessage({
          id: "queryBuilder_managedAttribute_placeholder"
        })}
        pageSize={15}
        onDataLoaded={(data) => {
          if (managedAttributeState.preloadId) {
            if (managedAttributeState.preloadId && data?.length === 1) {
              setManagedAttributeState({
                ...managedAttributeState,
                selectedManagedAttribute: data[0]
              });
            }
          }
        }}
        onChange={(newValue) => {
          const fieldPath =
            (managedAttributeConfig?.path ?? "") +
            "." +
            ((newValue as PersistedResource<ManagedAttribute>).key ?? "");

          setManagedAttributeState({
            ...managedAttributeState,
            selectedManagedAttribute:
              newValue as PersistedResource<ManagedAttribute>,
            selectedManagedAttributeConfig: fieldValueToIndexSettings(
              fieldPath,
              indexMap ?? []
            ),
            selectedOperator: "",
            selectedType: "",
            searchValue: ""
          });
        }}
        value={managedAttributeSelected}
        selectProps={{
          controlShouldRenderValue: true,
          isClearable: false,
          className: isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0",
          onKeyDown,
          captureMenuScroll: true,
          menuPlacement: isInColumnSelector ? "bottom" : "auto",
          menuShouldScrollIntoView: false,
          minMenuHeight: 600,
          onMenuOpen: () => {
            setIsMenuOpen(true);
          },
          onMenuClose: () => {
            setIsMenuOpen(false);
          }
        }}
        omitNullOption={true}
      />

      {/* Operator */}
      {!isInColumnSelector && operatorOptions.length !== 0 ? (
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
        <div className="col ps-0">
          {supportedValueForType(managedAttributeType)}
        </div>
      )}
    </div>
  );
}

/**
 * Using the query row for a managed attribute search, generate the elastic search request to be
 * made.
 */
export function transformManagedAttributeToDSL({
  value,
  fieldInfo,
  indexMap
}: TransformToDSLProps): any {
  // Parse the managed attribute search options. Trim the search value.
  let managedAttributeSearchValue: ManagedAttributeSearchStates;
  try {
    managedAttributeSearchValue = JSON.parse(value);
  } catch (e) {
    console.error(e);
    return;
  }
  managedAttributeSearchValue.searchValue =
    managedAttributeSearchValue.searchValue.trim();

  if (
    managedAttributeSearchValue.selectedOperator !== "empty" &&
    managedAttributeSearchValue.selectedOperator !== "notEmpty"
  ) {
    if (!managedAttributeSearchValue.searchValue) {
      return undefined;
    }
  }

  // Selected type needs to exist for a search to be performed properly.
  if (!managedAttributeSearchValue.selectedType) {
    return undefined;
  }

  const fieldPath: string =
    fieldInfo?.path +
    "." +
    managedAttributeSearchValue.selectedManagedAttribute?.key;

  // Check if managed attribute can be found within the index map.
  const managedAttributeFieldInfo = fieldValueToIndexSettings(
    fieldPath,
    indexMap ?? []
  );

  const commonProps = {
    fieldPath,
    operation: managedAttributeSearchValue.selectedOperator,
    queryType: "",
    value: managedAttributeSearchValue.searchValue,
    fieldInfo: managedAttributeFieldInfo
      ? managedAttributeFieldInfo
      : ({
          ...fieldInfo,
          distinctTerm: false,

          // All managed attributes have keyword support.
          keywordMultiFieldSupport: true
        } as ESIndexMapping)
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

export function validateManagedAttribute(
  fieldName: string,
  value: string,
  _operator: string,
  formatMessage: any
): ValidationResult {
  try {
    // Parse the managed attribute search options. Trim the search value.
    const managedAttributeSearchValue: ManagedAttributeSearchStates =
      JSON.parse(value);
    managedAttributeSearchValue.searchValue =
      managedAttributeSearchValue.searchValue.trim();

    switch (managedAttributeSearchValue.selectedType) {
      case "INTEGER":
      case "DECIMAL":
        return validateNumber(
          fieldName,
          managedAttributeSearchValue.searchValue,
          managedAttributeSearchValue.selectedOperator,
          formatMessage
        );
      case "DATE":
        return validateDate(
          fieldName,
          managedAttributeSearchValue.searchValue,
          managedAttributeSearchValue.selectedOperator,
          formatMessage
        );
      // case "PICK_LIST":
      // case "STRING":
      // case "BOOL":
    }

    return true;
  } catch {
    return true;
  }
}
