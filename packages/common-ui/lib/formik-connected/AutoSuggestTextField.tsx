import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { debounce, noop, uniq } from "lodash";
import { InputHTMLAttributes, useCallback, useState } from "react";
import AutoSuggest, {
  InputProps,
  ShouldRenderReasons
} from "react-autosuggest";

export type AutoSuggestTextFieldProps<
  T extends KitsuResource
> = TextFieldProps & AutoSuggestConfig<T>;

interface AutoSuggestConfig<T extends KitsuResource> {
  query?: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec;
  suggestion?: (resource: PersistedResource<T>) => string;
  configQuery?: () => JsonApiQuerySpec;
  configSuggestion?: (resource: PersistedResource<T>) => string[];
  shouldRenderSuggestions?: (
    value: string,
    reason: ShouldRenderReasons
  ) => boolean;
  onSuggestionSelected?: (selectedSuggestion: string) => void;
}

/**
 * Suggests typeahead values based on a back-end query.
 * The suggestion values are taken from each returned API resource.
 */
export function AutoSuggestTextField<T extends KitsuResource>({
  query,
  suggestion,
  shouldRenderSuggestions,
  configQuery,
  configSuggestion,
  onSuggestionSelected,
  ...textFieldProps
}: AutoSuggestTextFieldProps<T>) {
  return (
    <TextField
      {...textFieldProps}
      customInput={inputProps => (
        <AutoSuggestTextFieldInternal
          query={query}
          suggestion={suggestion}
          configQuery={configQuery}
          configSuggestion={configSuggestion}
          {...inputProps}
          shouldRenderSuggestions={shouldRenderSuggestions}
          onSuggestionSelected={onSuggestionSelected}
        />
      )}
    />
  );
}

function AutoSuggestTextFieldInternal<T extends KitsuResource>({
  query,
  suggestion,
  shouldRenderSuggestions,
  configQuery,
  configSuggestion,
  onSuggestionSelected,
  ...inputProps
}: InputHTMLAttributes<any> & AutoSuggestConfig<T>) {
  const formikCtx = useFormikContext<any>();

  const [searchValue, setSearchValue] = useState("");
  const debouncedSetSearchValue = useCallback(
    debounce(setSearchValue, 250),
    []
  );

  const { loading, response } = useQuery<T[]>(
    configQuery ? configQuery() : (query?.(searchValue, formikCtx) as any)
  );

  const suggestions = !loading
    ? configSuggestion
      ? configSuggestion(response?.data?.[0] as any)
      : uniq((response?.data ?? []).map(suggestion ?? noop))
    : [];

  return (
    <>
      <style>{`
        .autosuggest .container-open {      
            position: absolute;
            z-index: 2; 
            margin: 0 0 0 -15px; 
         },
        .autosuggest .container {
           display:none;
        }
        .autosuggest .autosuggest-highlighted { 
          background-color: #ddd; 
        }
        `}</style>
      <div className="autosuggest">
        <AutoSuggest
          suggestions={suggestions}
          getSuggestionValue={s => s}
          onSuggestionsFetchRequested={({ value }) =>
            debouncedSetSearchValue(value)
          }
          onSuggestionSelected={(_, data) => {
            inputProps.onChange?.({
              target: { value: data.suggestion }
            } as any);
            onSuggestionSelected?.(data.suggestion);
          }}
          onSuggestionsClearRequested={() => {
            debouncedSetSearchValue.cancel();
            debouncedSetSearchValue("");
          }}
          renderSuggestion={text => <div>{text}</div>}
          shouldRenderSuggestions={shouldRenderSuggestions}
          inputProps={inputProps as InputProps<any>}
          theme={{
            suggestionsList: "list-group",
            suggestion: "list-group-item",
            suggestionHighlighted: "autosuggest-highlighted",
            suggestionsContainerOpen: "container-open",
            suggestionsContainer: "container"
          }}
        />
      </div>
    </>
  );
}
