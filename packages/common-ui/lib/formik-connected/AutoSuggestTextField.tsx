import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { castArray, compact, uniq } from "lodash";
import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useState
} from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";
import { useIntl } from "react-intl";
import { useDebounce } from "use-debounce";
import { OnFormikSubmit } from "./safeSubmit";

type SingleOrArray<T> = T | T[];

export type AutoSuggestTextFieldProps<T extends KitsuResource> =
  TextFieldProps & AutoSuggestConfig<T>;

interface AutoSuggestConfig<T extends KitsuResource> {
  query?: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec;
  /** Hard-coded suggestions */
  suggestions?: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => (string | null | undefined)[];
  /** Configures a  */
  suggestion?: (
    resource: PersistedResource<T>,
    searchValue: string
  ) => SingleOrArray<string | null | undefined>;
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
  suggestions,
  onSuggestionSelected,
  timeoutMs,
  alwaysShowSuggestions,
  ...textFieldProps
}: AutoSuggestTextFieldProps<T>) {
  const { formatMessage } = useIntl();

  return (
    <TextField
      {...textFieldProps}
      customInput={inputProps => (
        <AutoSuggestTextFieldInternal
          query={query}
          suggestion={suggestion}
          suggestions={suggestions}
          {...inputProps}
          placeholder={
            inputProps.placeholder || formatMessage({ id: "typeHereToSearch" })
          }
          autoComplete="none"
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
  suggestions,
  suggestion = (it, searchVal) => (!searchVal ? String(it) : String(searchVal)),
  onSuggestionSelected,
  id,
  timeoutMs = 250,
  alwaysShowSuggestions,
  ...inputProps
}: InputHTMLAttributes<any> & AutoSuggestConfig<T>) {
  const formik = useFormikContext<any>();

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue] = timeoutMs
    ? useDebounce(searchValue, timeoutMs)
    : [searchValue];

  const { loading, response } = useQuery<T[]>(
    {
      path: "",
      // Default newest first:
      sort: "-createdOn",
      ...query?.(debouncedSearchValue, formik)
    },
    {
      // Don't show results when the search is empty:
      disabled:
        !query || (!alwaysShowSuggestions && !debouncedSearchValue?.trim())
    }
  );

  const allSuggestions = compact([
    ...(suggestions?.(searchValue, formik) || []),
    ...(response && !loading
      ? uniq(
          castArray(response.data).flatMap(it =>
            suggestion(it, debouncedSearchValue)
          )
        )
      : [])
  ]);

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
          suggestions={allSuggestions}
          getSuggestionValue={s => s}
          onSuggestionsFetchRequested={({ value }) => setSearchValue(value)}
          onSuggestionSelected={(_, data) => {
            inputProps.onChange?.({
              target: { value: data.suggestion }
            } as any);
            onSuggestionSelected?.(data.suggestion, formik);
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
