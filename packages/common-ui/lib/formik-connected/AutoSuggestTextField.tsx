import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { castArray, uniq } from "lodash";
import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useState
} from "react";
import AutoSuggest, {
  InputProps,
  ShouldRenderReasons
} from "react-autosuggest";
import { useDebounce } from "use-debounce";
import { OnFormikSubmit } from "./safeSubmit";

export type AutoSuggestTextFieldProps<T extends KitsuResource> =
  TextFieldProps & AutoSuggestConfig<T>;

interface AutoSuggestConfig<T extends KitsuResource> {
  query?: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec;
  suggestion?: (
    resource: PersistedResource<T>,
    searchValue: string
  ) => string | string[] | undefined;
  configSuggestion?: (resource: PersistedResource<T>) => string[];
  onSuggestionSelected?: OnFormikSubmit<ChangeEvent<HTMLInputElement>>;
  timeoutMs?: number;
  /** Show the suggestions even when the input is blank. */
  alwaysShowSuggestions?: boolean;
}

/**
 * Suggests typeahead values based on a back-end query.
 * The suggestion values are taken from each returned API resource.
 */
export function AutoSuggestTextField<T extends KitsuResource>({
  query,
  suggestion,
  configSuggestion,
  onSuggestionSelected,
  timeoutMs,
  alwaysShowSuggestions,
  ...textFieldProps
}: AutoSuggestTextFieldProps<T>) {
  return (
    <TextField
      {...textFieldProps}
      customInput={inputProps => (
        <AutoSuggestTextFieldInternal
          query={query}
          suggestion={suggestion}
          {...inputProps}
          onSuggestionSelected={onSuggestionSelected}
          alwaysShowSuggestions={alwaysShowSuggestions}
          id={textFieldProps.name}
          timeoutMs={timeoutMs}
        />
      )}
    />
  );
}

function AutoSuggestTextFieldInternal<T extends KitsuResource>({
  query,
  suggestion = (it, searchVal) => (!searchVal ? String(it) : String(searchVal)),
  onSuggestionSelected,
  id,
  timeoutMs = 250,
  alwaysShowSuggestions,
  ...inputProps
}: InputHTMLAttributes<any> & AutoSuggestConfig<T>) {
  const formikCtx = useFormikContext<any>();

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue] = timeoutMs
    ? useDebounce(searchValue, timeoutMs)
    : [searchValue];

  const { loading, response } = useQuery<T[]>(
    query?.(debouncedSearchValue, formikCtx) as any,
    {
      // Don't show results when the search is empty:
      disabled: !alwaysShowSuggestions && !debouncedSearchValue?.trim()
    }
  );

  const suggestions =
    response && !loading
      ? uniq(
          castArray(response.data).flatMap(it =>
            suggestion(it, debouncedSearchValue)
          )
        )
      : [];

  useEffect(() => {
    const autosuggestGeneratedDivs =
      document?.querySelectorAll<any>(".autosuggest div");
    // Remove the role from react auto suggest generated div to fix WCAG issues, see #23517
    autosuggestGeneratedDivs?.forEach(element => {
      if (element.attributes.role) {
        element.attributes.role.nodeValue = "";
      }
    });
  }, []);

  return (
    <>
      <style>{`
        .autosuggest-container {
          position: relative;
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
        <AutoSuggest
          id={id}
          suggestions={suggestions}
          getSuggestionValue={s => s}
          onSuggestionsFetchRequested={({ value }) => setSearchValue(value)}
          onSuggestionSelected={(_, data) => {
            inputProps.onChange?.({
              target: { value: data.suggestion }
            } as any);
            onSuggestionSelected?.(data.suggestion, formikCtx);
          }}
          onSuggestionsClearRequested={() => setSearchValue("")}
          renderSuggestion={text => <div>{text}</div>}
          shouldRenderSuggestions={
            alwaysShowSuggestions ? () => !!alwaysShowSuggestions : undefined
          }
          inputProps={inputProps as InputProps<any>}
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
  );
}
