import { useEffect, useState } from "react";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "./QueryBuilderTextSearch";
import Select from "react-select";
import { useIntl } from "react-intl";
import { SelectOption, useQuery } from "common-ui";
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

export interface FieldExtensionPackageOption extends SelectOption<string> {
  fieldOptions: FieldExtensionOption[];
}

export interface FieldExtensionOption extends SelectOption<string> {
  acceptedValues?: string[];
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
                  acceptedValues: field?.acceptedValues
                })
              )
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
  ].map<SelectOption<string>>((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

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

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator =
    operatorOptions?.find(
      (operator) => operator.value === fieldExtensionState.selectedOperator
    ) ?? null;

  // If field extension has accepted values, get all the available options for the dropdown menu.
  const pickListOptions =
    selectedField?.acceptedValues?.map<SelectOption<string>>((pickOption) => ({
      value: pickOption,
      label: pickOption
    })) ?? [];

  // Automatically set the operator.
  if (!selectedOperator && operatorOptions?.[0]) {
    setFieldExtensionState({
      ...fieldExtensionState,
      selectedOperator: operatorOptions?.[0].value ?? ""
    });
  }

  return (
    <div className="row">
      {/* Extension Selector */}
      <Select<FieldExtensionPackageOption>
        options={extensionOptions}
        className={`col me-1 ms-2 ps-0`}
        value={selectedExtension}
        placeholder={formatMessage({
          id: "queryBuilder_extension_placeholder"
        })}
        onChange={(selected) =>
          setFieldExtensionState({
            selectedExtension: selected?.value ?? "",
            selectedField: "",
            searchValue: "",
            selectedOperator: ""
          })
        }
        onInputChange={(inputValue) => setExtensionSearchValue(inputValue)}
        inputValue={extensionSearchValue}
      />

      {/* Field Selector */}
      {selectedExtension ? (
        <>
          <Select<FieldExtensionOption>
            options={selectedExtension?.fieldOptions}
            className={`col me-1 ps-0`}
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
            onInputChange={(inputValue) => setFieldSearchValue(inputValue)}
            inputValue={fieldSearchValue}
          />
        </>
      ) : (
        <></>
      )}

      {/* Operator Selector */}
      {selectedField ? (
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
          />

          {/* Search Value */}
          <div className="col ps-0">
            {selectedField?.acceptedValues ? (
              <>
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
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
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
  fieldInfo
}: TransformToDSLProps): any {
  // Parse the field extension search options. Trim the search value.
  const fieldExtensionSearchValue: FieldExtensionSearchStates =
    JSON.parse(value);
  fieldExtensionSearchValue.searchValue =
    fieldExtensionSearchValue.searchValue.trim();

  if (!fieldExtensionSearchValue.searchValue) {
    return undefined;
  }

  return transformTextSearchToDSL({
    fieldPath:
      fieldInfo?.path +
      "." +
      fieldExtensionSearchValue.selectedExtension +
      "." +
      fieldExtensionSearchValue.selectedField,
    operation: fieldExtensionSearchValue.selectedOperator,
    queryType: "",
    value: fieldExtensionSearchValue.searchValue,
    fieldInfo: {
      ...fieldInfo,
      distinctTerm: true
    } as ESIndexMapping
  });
}
