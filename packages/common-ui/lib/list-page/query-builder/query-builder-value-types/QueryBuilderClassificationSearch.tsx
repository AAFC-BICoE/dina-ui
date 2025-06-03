import React, { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import _ from "lodash";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import { VocabularyOption } from "../../../../../dina-ui/components/collection/VocabularySelectField";
import useVocabularyOptions from "../../../../../dina-ui/components/collection/useVocabularyOptions";
import { SelectOption } from "packages/common-ui/lib/formik-connected/SelectField";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import { transformTextSearchToDSL } from "./QueryBuilderTextSearch";

interface QueryRowClassificationSearchProps {
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

export interface ClassificationSearchStates {
  selectedClassificationRank: string;

  /** Operator to be used on the classification search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

// Supported operators for the classification search.
export const SUPPORTED_CLASSIFICATION_OPERATORS: string[] = [
  "exactMatch",
  "wildcard",
  "in",
  "notIn",
  "startsWith",
  "notEquals",
  "empty",
  "notEmpty"
];

export default function QueryRowClassificationSearch({
  value,
  setValue,
  isInColumnSelector
}: QueryRowClassificationSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = isInColumnSelector
    ? _.noop
    : useQueryBuilderEnterToSearch();

  const [classificationState, setClassificationState] =
    useState<ClassificationSearchStates>(() =>
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
      setValue(JSON.stringify(classificationState));
    }
  }, [classificationState, setValue]);

  // Convert a value from Query Builder into the classification State in this component.
  // Dependent on the identifierConfig to indicate when it's changed.
  useEffect(() => {
    if (value) {
      setClassificationState(JSON.parse(value));
    }
  }, []);

  // Retrieve the classification options
  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/taxonomicRank"
  });

  // Capitalize each label for the taxonomic rank options.
  useMemo(() => {
    taxonomicRankOptions.forEach((option) => {
      option.label = _.startCase(option.label);
    });
  }, [taxonomicRankOptions]);

  // Generate the operator options
  const operatorOptions = SUPPORTED_CLASSIFICATION_OPERATORS.map<
    SelectOption<string>
  >((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === classificationState.selectedOperator
  );

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Classification Rank Selection */}
      <Select<VocabularyOption>
        options={taxonomicRankOptions}
        value={taxonomicRankOptions.find(
          (option) =>
            option.value === classificationState.selectedClassificationRank
        )}
        isLoading={loading}
        placeholder={formatMessage({
          id: "queryBuilder_classification_placeholder"
        })}
        onChange={(newValue) => {
          setClassificationState({
            ...classificationState,
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
        classificationState.selectedClassificationRank !== "" && (
          <Select<SelectOption<string>>
            options={operatorOptions}
            className={`col me-1 ps-0`}
            value={selectedOperator}
            onChange={(selected) =>
              setClassificationState({
                ...classificationState,
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
        classificationState.selectedClassificationRank !== "" &&
        classificationState.selectedOperator !== "empty" &&
        classificationState.selectedOperator !== "notEmpty" && (
          <input
            type="text"
            value={classificationState.searchValue}
            onChange={(newValue) => {
              setClassificationState({
                ...classificationState,
                searchValue: newValue.target.value
              });
            }}
            className={"col form-control me-3"}
            placeholder={
              classificationState.selectedOperator !== "in" &&
              classificationState.selectedOperator !== "notIn"
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
export function transformClassificationToDSL({
  value,
  fieldInfo
}: TransformToDSLProps): any {
  // Parse the classification search options. Trim the search value.
  let classificationValue: ClassificationSearchStates;
  try {
    classificationValue = JSON.parse(value);
  } catch (e) {
    console.error(e);
    return;
  }
  classificationValue.searchValue = classificationValue.searchValue.trim();

  if (
    classificationValue.selectedOperator !== "empty" &&
    classificationValue.selectedOperator !== "notEmpty"
  ) {
    if (!classificationValue.searchValue) {
      return undefined;
    }
  }

  // The path to search against elastic search. Using the rank to generate this path.
  const fieldPath: string =
    fieldInfo?.path + "." + classificationValue.selectedClassificationRank;

  const commonProps = {
    fieldPath,
    operation: classificationValue.selectedOperator,
    queryType: "",
    value: classificationValue.searchValue,
    fieldInfo: {
      ...fieldInfo,
      distinctTerm: false,

      // All managed attributes have keyword support.
      keywordMultiFieldSupport: true
    } as ESIndexMapping
  };

  return transformTextSearchToDSL({ ...commonProps });
}
