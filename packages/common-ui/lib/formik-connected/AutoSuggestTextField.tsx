import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { castArray, debounce, uniq } from "lodash";
import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useCallback,
  useEffect,
  useState
} from "react";
import AutoSuggest, {
  InputProps,
  ShouldRenderReasons
} from "react-autosuggest";
import { OnFormikSubmit } from "./safeSubmit";

export type AutoSuggestTextFieldProps<T extends KitsuResource> =
  TextFieldProps & AutoSuggestConfig<T>;

interface AutoSuggestConfig<T extends KitsuResource> {
  query?: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec;
  suggestion?: (resource: PersistedResource<T>) => string | string[];
  configQuery?: () => JsonApiQuerySpec;
  configSuggestion?: (resource: PersistedResource<T>) => string[];
  shouldRenderSuggestions?: (
    value: string,
    reason: ShouldRenderReasons
  ) => boolean;
  onSuggestionSelected?: OnFormikSubmit<ChangeEvent<HTMLInputElement>>;
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
          id={textFieldProps.name}
        />
      )}
    />
  );
}

function AutoSuggestTextFieldInternal<T extends KitsuResource>({
  query,
  suggestion = it => String(it),
  shouldRenderSuggestions,
  configQuery,
  configSuggestion,
  onSuggestionSelected,
  id,
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

  const suggestions =
    response && !loading
      ? configSuggestion
        ? configSuggestion(response.data?.[0] as any)
        : uniq(castArray(response.data).flatMap(suggestion))
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
          id={id}
          suggestions={suggestions}
          getSuggestionValue={s => s}
          onSuggestionsFetchRequested={({ value }) =>
            debouncedSetSearchValue(value)
          }
          onSuggestionSelected={(_, data) => {
            inputProps.onChange?.({
              target: { value: data.suggestion }
            } as any);
            onSuggestionSelected?.(data.suggestion, formikCtx);
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
