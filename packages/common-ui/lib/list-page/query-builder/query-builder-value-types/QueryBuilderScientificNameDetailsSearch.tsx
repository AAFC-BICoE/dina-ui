import React, { useState } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import { noop } from "lodash";
import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import { VocabularyOption } from "../../../../../dina-ui/components/collection/VocabularySelectField";
import useVocabularyOptions from "../../../../../dina-ui/components/collection/useVocabularyOptions";

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

  // Retrieve the classification options
  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/taxonomicRank"
  });

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
        className={isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0"}
        onKeyDown={onKeyDown}
        captureMenuScroll={true}
        menuPlacement={isInColumnSelector ? "bottom" : "auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
      />
    </div>
  );
}
