import { ESIndexMapping } from "../../types";
import { useElasticSearchDistinctTerm } from "../../useElasticSearchDistinctTerm";
import AutoSuggest, { InputProps } from "react-autosuggest";
import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { noop } from "lodash";
import { useAccount } from "common-ui/lib";

interface QueryBuilderAutoSuggestionTextSearchProps {
  /**
   * Current field selected in the Query Builder.
   */
  currentFieldName?: string;

  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue: ((fieldPath: string) => void) | undefined;

  /**
   * Required in order to know what index to search against elastic search for the suggestions.
   */
  indexName: string;

  /**
   * The elastic search mapping changes based on the field that is selected. This is used to
   * create the field name for the elastic search request.
   */
  indexMap?: ESIndexMapping[];
}

function QueryBuilderAutoSuggestionTextSearch({
  currentFieldName,
  matchType,
  value,
  setValue,
  indexName,
  indexMap
}: QueryBuilderAutoSuggestionTextSearchProps) {
  const { formatMessage } = useIntl();
  const { groupNames } = useAccount();

  // Index settings for the field currently selected.
  const [fieldSettings, setFieldSettings] = useState<
    ESIndexMapping | undefined
  >();

  // Field name for the field currently selected.
  const [fieldName, setFieldName] = useState<string>();

  // State to store if the text field is focused. Used to determine if suggestions should be
  // displayed.
  const [focus, setFocus] = useState<boolean>(false);

  // Retrieve the suggestions using elastic search. Only updates if the field/group change.
  const suggestions = useElasticSearchDistinctTerm({
    fieldName,
    groups: groupNames ?? [],
    relationshipType: fieldSettings?.parentType,
    indexName
  });

  // Whenever the current field name changes, retrieve the new field settings for that field.
  useEffect(() => {
    setFieldSettings(
      indexMap?.find((attribute) => attribute.value === currentFieldName)
    );
  }, [currentFieldName]);

  useEffect(() => {
    if (!fieldSettings) return;

    setFieldName(
      fieldSettings?.parentPath
        ? fieldSettings?.parentPath +
            "." +
            fieldSettings?.path +
            "." +
            fieldSettings?.label
        : fieldSettings?.value
    );
  }, [fieldSettings]);

  const inputProps: InputProps<any> = {
    placeholder: formatMessage({ id: "typeHereToSearch" }) ?? "",
    value: value ?? "",
    onChange: (_event, { newValue }) => {
      setValue?.(newValue);
    },
    autoComplete: "none",
    className: "form-control",
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  };

  // Filter the suggestion list based on the value.
  const currentSuggestions = useMemo(
    () =>
      suggestions?.filter(
        (suggestion) =>
          suggestion?.toLowerCase()?.includes(value?.toLowerCase() ?? "") &&
          suggestion !== value
      ),
    [value, suggestions]
  );

  return (
    <>
      {/* Depending on the matchType, it changes the rest of the query row. */}
      {(matchType === "equals" || matchType === "notEquals") && (
        <>
          <style>{`
          .autosuggest-container {
            position: relative;
            width: 100%;
          }
          .autosuggest .suggestions-container {
            display: none;
          }
          .autosuggest .suggestions-container-open {
            display: block;
            position: absolute;
            width: 100%;
            z-index: 20;
          }
          .autosuggest .suggestion-highlighted { 
            background-color: #ddd;
            cursor: pointer;
          }
        `}</style>
          <div className="autosuggest">
            <AutoSuggest<string>
              multiSection={false}
              suggestions={currentSuggestions}
              getSuggestionValue={(s) => s}
              onSuggestionsFetchRequested={({ value: fetchValue }) =>
                setValue?.(fetchValue)
              }
              onSuggestionSelected={(_event, data) =>
                setValue?.(data.suggestion)
              }
              onSuggestionsClearRequested={noop}
              renderSuggestion={(text) => <div>{text}</div>}
              inputProps={inputProps}
              alwaysRenderSuggestions={focus}
              theme={{
                suggestionsList: "list-group",
                suggestion: "list-group-item",
                suggestionHighlighted: "suggestion-highlighted",
                suggestionsContainerOpen: "suggestions-container-open",
                suggestionsContainer: "suggestions-container",
                container: "autosuggest-container"
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

export const QueryBuilderAutoSuggestionTextSearchMemo = React.memo(
  QueryBuilderAutoSuggestionTextSearch
);
