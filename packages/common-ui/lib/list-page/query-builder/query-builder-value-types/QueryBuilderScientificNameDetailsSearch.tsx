import React, { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import { noop, startCase } from "lodash";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import { VocabularyOption } from "../../../../../dina-ui/components/collection/VocabularySelectField";
import useVocabularyOptions from "../../../../../dina-ui/components/collection/useVocabularyOptions";
import { SelectOption } from "packages/common-ui/lib/formik-connected/SelectField";

interface QueryRowScientificNameDetailsSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * If being used in the column selector, operators do not need to be displayed.
   */
  isInColumnSelector: boolean;
}

export interface ScientificNameDetailsSearchStates {
  selectedClassificationRank: string;

  /** Operator to be used on the scientific name details search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

export default function QueryRowScientificNameDetailsSearch({
  value,
  setValue,
  isInColumnSelector
}: QueryRowScientificNameDetailsSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = isInColumnSelector ? noop : useQueryBuilderEnterToSearch();

  const [scientificNameDetailsState, setScientificNameDetailsState] =
    useState<ScientificNameDetailsSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            searchValue: "",
            selectedOperator: "",
            selectedClassificationRank: ""
          }
    );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(scientificNameDetailsState));
    }
  }, [scientificNameDetailsState]);

  // Convert a value from Query Builder into the Scientific Name Details State in this component.
  // Dependent on the identifierConfig to indicate when it's changed.
  useEffect(() => {
    if (value) {
      setScientificNameDetailsState(JSON.parse(value));
    }
  }, []);

  // Supported operators for the classification search.
  const supportedOperators: string[] = [
    "exactMatch",
    "wildcard",
    "in",
    "notIn",
    "startsWith",
    "notEquals",
    "empty",
    "notEmpty"
  ];

  // Retrieve the classification options
  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/taxonomicRank"
  });

  // Capitalize each label for the taxonomic rank options.
  useMemo(() => {
    taxonomicRankOptions.forEach((option) => {
      option.label = startCase(option.label);
    });
  }, [taxonomicRankOptions]);

  // Generate the operator options
  const operatorOptions = supportedOperators.map<SelectOption<string>>(
    (option) => ({
      label: formatMessage({ id: "queryBuilder_operator_" + option }),
      value: option
    })
  );

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === scientificNameDetailsState.selectedOperator
  );

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Classification Rank Selection */}
      <Select<VocabularyOption>
        options={taxonomicRankOptions}
        value={taxonomicRankOptions.find(
          (option) =>
            option.value ===
            scientificNameDetailsState.selectedClassificationRank
        )}
        isLoading={loading}
        placeholder={formatMessage({
          id: "queryBuilder_scientificNameDetails_placeholder"
        })}
        onChange={(newValue) => {
          setScientificNameDetailsState({
            ...scientificNameDetailsState,
            selectedClassificationRank: newValue?.value ?? "",
            selectedOperator: "",
            searchValue: ""
          });
        }}
        controlShouldRenderValue={true}
        isClearable={false}
        className={isInColumnSelector ? "ps-0 mt-2 mb-3" : "col me-1 ms-2 ps-0"}
        onKeyDown={onKeyDown}
        captureMenuScroll={true}
        menuPlacement={isInColumnSelector ? "bottom" : "auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
      />

      {/* Operator Selection */}
      {!isInColumnSelector &&
        scientificNameDetailsState.selectedClassificationRank !== "" && (
          <Select<SelectOption<string>>
            options={operatorOptions}
            className={`col me-1 ps-0`}
            value={selectedOperator}
            onChange={(selected) =>
              setScientificNameDetailsState({
                ...scientificNameDetailsState,
                selectedOperator: selected?.value ?? ""
              })
            }
            captureMenuScroll={true}
            menuPlacement={"auto"}
            menuShouldScrollIntoView={false}
            minMenuHeight={600}
          />
        )}

      {/* Search Value Input */}
      {!isInColumnSelector &&
        scientificNameDetailsState.selectedClassificationRank !== "" &&
        scientificNameDetailsState.selectedOperator !== "empty" &&
        scientificNameDetailsState.selectedOperator !== "notEmpty" && (
          <input
            type="text"
            value={scientificNameDetailsState.searchValue}
            onChange={(newValue) => {
              setScientificNameDetailsState({
                ...scientificNameDetailsState,
                searchValue: newValue.target.value
              });
            }}
            className={"col form-control me-3"}
            placeholder={
              scientificNameDetailsState.selectedOperator !== "in" &&
              scientificNameDetailsState.selectedOperator !== "notIn"
                ? formatMessage({
                    id: "queryBuilder_value_text_placeholder"
                  })
                : formatMessage({ id: "queryBuilder_value_in_placeholder" })
            }
            onKeyDown={onKeyDown}
          />
        )}
    </div>
  );
}

/**
 * Using the query row for a target organism primary classification search, generate the elastic
 * search request to be made.
 */
// export function transformClassificationToDSL({
//   value,
//   fieldInfo,
//   indexMap
// }: TransformToDSLProps): any {

// }
