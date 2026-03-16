import { useEffect, useState } from "react";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "./QueryBuilderTextSearch";
import Select from "react-select";
import { useIntl } from "react-intl";
import { SelectOption, useQuery } from "common-ui";
import { FieldExtension } from "../../../../../dina-ui/types/collection-api/resources/FieldExtension";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL
} from "./QueryBuilderNumberSearch";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL
} from "./QueryBuilderDateSearch";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import QueryBuilderBooleanSearch from "./QueryBuilderBooleanSearch";
import { fieldValueToIndexSettings } from "../useQueryBuilderConfig";

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

  /**
   * If being used in the column selector, operators and different styling is applied.
   */
  isInColumnSelector: boolean;
}

export interface FieldExtensionPackageOption extends SelectOption<string> {
  fieldOptions: FieldExtensionOption[];
}

export interface FieldExtensionOption extends SelectOption<string> {
  acceptedValues?: string[];
  vocabularyElementType?: string;
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

  /** The type of the selected field extension. */
  selectedType: string;
}

export default function QueryRowFieldExtensionSearch({
  value,
  setValue,
  fieldExtensionConfig,
  isInColumnSelector
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
            searchValue: "",
            selectedType: ""
          }
    );

  const [extensionOptions, setExtensionOptions] = useState<
    FieldExtensionPackageOption[]
  >([]);
  const [extensionSearchValue, setExtensionSearchValue] = useState<string>("");
  const [fieldSearchValue, setFieldSearchValue] = useState<string>("");

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch(isInColumnSelector);

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
        "extension.fields.dinaComponent":
          fieldExtensionConfig?.dynamicField?.component ?? ""
      }
    },
    {
      onSuccess: ({ data }) => {
        setExtensionOptions(
          data.map<FieldExtensionPackageOption>((fieldExtension) => ({
            label: fieldExtension?.extension?.name ?? "",
            value: fieldExtension?.extension?.key ?? "",
            fieldOptions:
              fieldExtension?.extension?.fields?.map<FieldExtensionOption>(
                (field) => ({
                  label: field?.name,
                  value: field?.key,
                  acceptedValues: field?.acceptedValues,
                  vocabularyElementType: field?.vocabularyElementType
                })
              )
          }))
        );
      },
      disabled: fieldExtensionConfig?.dynamicField === undefined
    }
  );

  const selectedExtension =
    extensionOptions?.find(
      (fieldExtensionPackage) =>
        fieldExtensionPackage.value === fieldExtensionState.selectedExtension
    ) ?? null;

  const selectedField =
    selectedExtension?.fieldOptions?.find(
      (fieldExtension) =>
        fieldExtension.value === fieldExtensionState.selectedField
    ) ?? null;

  // Determine the type of the selected field extension.
  const fieldExtensionType = selectedField?.acceptedValues
    ? "PICK_LIST"
    : selectedField?.vocabularyElementType ?? "";

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
      default:
        return [
          "exactMatch",
          "wildcard",
          "in",
          "notIn",
          "startsWith",
          "notEquals",
          "empty",
          "notEmpty"
        ].filter((option) => option !== undefined) as string[];
    }
  };

  // Generate the operator options
  const operatorOptions = supportedOperatorsForType(fieldExtensionType).map<
    SelectOption<string>
  >((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator =
    operatorOptions?.find(
      (operator) => operator.value === fieldExtensionState.selectedOperator
    ) ?? null;

  // Automatically set the operator and type.
  if (fieldExtensionState.selectedType === "" && fieldExtensionType !== "") {
    setFieldExtensionState({
      ...fieldExtensionState,
      selectedType: fieldExtensionType
    });
  }
  if (!selectedOperator && operatorOptions?.[0]) {
    setFieldExtensionState({
      ...fieldExtensionState,
      selectedOperator: operatorOptions?.[0].value ?? ""
    });
  }

  // Determine the value input to display based on the type.
  const supportedValueForType = (type: string) => {
    const operator = fieldExtensionState.selectedOperator;

    // If the operator is "empty" or "not empty", do not display anything.
    if (operator === "empty" || operator === "notEmpty") {
      return <></>;
    }

    const commonProps = {
      matchType: operator,
      value: fieldExtensionState.searchValue,
      setValue: (userInput) =>
        setFieldExtensionState({
          ...fieldExtensionState,
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
          selectedField?.acceptedValues?.map((pickOption) => ({
            value: pickOption,
            label: pickOption
          })) ?? [];
        return operator === "in" || operator === "notIn" ? (
          <Select<SelectOption<string>>
            options={pickListOptions}
            className={`col ps-0`}
            value={pickListOptions?.find(
              (pickOption) =>
                pickOption.value === fieldExtensionState.searchValue
            )}
            placeholder={formatMessage({
              id: "queryBuilder_pickList_placeholder"
            })}
            onChange={(pickListOption) =>
              setFieldExtensionState({
                ...fieldExtensionState,
                searchValue: pickListOption?.value ?? ""
              })
            }
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
          />
        ) : (
          <Select
            options={pickListOptions}
            className={`col ps-0`}
            value={pickListOptions?.find(
              (pickOption) =>
                pickOption.value === fieldExtensionState.searchValue
            )}
            placeholder={formatMessage({
              id: "queryBuilder_pickList_placeholder"
            })}
            onChange={(pickListOption) =>
              setFieldExtensionState({
                ...fieldExtensionState,
                searchValue: pickListOption?.value ?? ""
              })
            }
            onKeyDown={onKeyDown}
          />
        );
      case "BOOL":
        // Automatically set the boolean value to true if it's not preset.
        if (
          fieldExtensionState.searchValue !== "true" &&
          fieldExtensionState.searchValue !== "false"
        ) {
          setFieldExtensionState({
            ...fieldExtensionState,
            searchValue: "true"
          });
        }
        return <QueryBuilderBooleanSearch {...commonProps} />;
      default:
        return <QueryBuilderTextSearch {...commonProps} />;
    }
  };

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Extension Selector */}
      <Select<FieldExtensionPackageOption>
        options={extensionOptions}
        className={isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0"}
        value={selectedExtension}
        placeholder={formatMessage({
          id: "queryBuilder_extension_placeholder"
        })}
        onChange={(selected) =>
          setFieldExtensionState({
            selectedExtension: selected?.value ?? "",
            selectedField: "",
            searchValue: "",
            selectedOperator: "",
            selectedType: ""
          })
        }
        onInputChange={(inputValue) => setExtensionSearchValue(inputValue)}
        inputValue={extensionSearchValue}
        captureMenuScroll={true}
        menuPlacement={isInColumnSelector ? "bottom" : "auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999
          })
        }}
      />

      {/* Field Selector */}
      {selectedExtension ? (
        <>
          <Select<FieldExtensionOption>
            options={selectedExtension?.fieldOptions}
            className={isInColumnSelector ? "ps-0 mt-2" : "col me-1 ps-0"}
            value={selectedField}
            placeholder={formatMessage({
              id: "queryBuilder_extension_field_placeholder"
            })}
            onChange={(selected) =>
              setFieldExtensionState({
                ...fieldExtensionState,
                selectedField: selected?.value ?? ""
              })
            }
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
            onInputChange={(inputValue) => setFieldSearchValue(inputValue)}
            inputValue={fieldSearchValue}
            captureMenuScroll={true}
            menuPlacement={isInColumnSelector ? "bottom" : "auto"}
            menuShouldScrollIntoView={false}
            minMenuHeight={600}
          />
        </>
      ) : (
        <></>
      )}

      {/* Operator Selector */}
      {!isInColumnSelector && selectedField ? (
        <>
          <Select<SelectOption<string>>
            options={operatorOptions}
            className={`col me-1 ps-0`}
            value={selectedOperator}
            onChange={(selected) =>
              setFieldExtensionState({
                ...fieldExtensionState,
                selectedOperator: selected?.value ?? ""
              })
            }
            captureMenuScroll={true}
            menuPlacement={isInColumnSelector ? "bottom" : "auto"}
            menuShouldScrollIntoView={false}
            minMenuHeight={600}
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
          />

          {/* Value Searching (changes based on the type selected) */}
          {!isInColumnSelector && (
            <div className="col ps-0 flex-grow-expand">
              {supportedValueForType(fieldExtensionType)}
            </div>
          )}
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

/**
 * Using the query row for a field extension search, generate the elastic search request to be
 * made.
 */
export function transformFieldExtensionToDSL({
  value,
  fieldInfo,
  indexMap
}: TransformToDSLProps): any {
  // Parse the field extension search options. Trim the search value.
  let fieldExtensionSearchValue: FieldExtensionSearchStates;
  try {
    fieldExtensionSearchValue = JSON.parse(value);
  } catch (e) {
    console.error(e);
    return;
  }

  fieldExtensionSearchValue.searchValue =
    fieldExtensionSearchValue.searchValue.trim();

  if (
    fieldExtensionSearchValue.selectedOperator !== "empty" &&
    fieldExtensionSearchValue.selectedOperator !== "notEmpty"
  ) {
    if (!fieldExtensionSearchValue.searchValue) {
      return undefined;
    }
  }

  // Selected type needs to exist for a search to be performed properly.
  if (!fieldExtensionSearchValue.selectedType) {
    return undefined;
  }

  const fieldPath: string =
    fieldInfo?.path +
    "." +
    fieldExtensionSearchValue.selectedExtension +
    "." +
    fieldExtensionSearchValue.selectedField;

  // Check if field extension can be found within the index map.
  const fieldExtensionFieldInfo = fieldValueToIndexSettings(
    fieldPath,
    indexMap ?? []
  );

  const commonProps = {
    fieldPath,
    operation: fieldExtensionSearchValue.selectedOperator,
    queryType: "",
    value: fieldExtensionSearchValue.searchValue,
    fieldInfo: fieldExtensionFieldInfo
      ? fieldExtensionFieldInfo
      : ({
          ...fieldInfo,
          distinctTerm: false,

          // All field extensions have keyword support.
          keywordMultiFieldSupport: true
        } as ESIndexMapping)
  };

  switch (fieldExtensionSearchValue.selectedType) {
    case "INTEGER":
    case "DECIMAL":
      return transformNumberSearchToDSL({ ...commonProps });
    case "DATE":
      return transformDateSearchToDSL({ ...commonProps });
    default:
      return transformTextSearchToDSL({ ...commonProps });
  }
}
