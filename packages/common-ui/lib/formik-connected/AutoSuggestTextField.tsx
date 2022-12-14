import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery,
  useAutocompleteSearch
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

type BackendOptions = "elastic-search" | "json-api";

type DropdownItem = string[] | string | null | undefined;

export type AutoSuggestTextFieldProps<T extends KitsuResource> =
  TextFieldProps & AutoSuggestConfig<T>;

export type JsonApiQueryProps = {
  /**
   * The search term used to search for the selected object. Can be useful for
   * displaying custom options.
   */
  searchTerm: string;

  /**
   * The formik context. Can be used to get existing fields on the form.
   */
  formikCtx: FormikContextType<any>;
};

interface AutoSuggestConfig<T extends KitsuResource> {
  /**
   * Elastic search backend configuration.
   *
   * Leave undefined if you don't want to use Elastic search for suggestions.
   */
  elasticSearchBackend?: {
    /**
     * The Elastic search index to use.
     *
     * Example: "dina_material_sample_index"
     */
    indexName: string;

    /**
     * The Elastic search field path to use.
     *
     * It will need to be the full path to the field, including the field name.
     *
     * Example: "data.attributes.name"
     */
    searchField: string;

    /**
     * Additional field to use for finding more results. This will need to be the full path to the
     * field, including the field name.
     */
    additionalSearchField?: string;

    /**
     * The Elastic search query field. This will need to be the full path to the field, including
     * the field name.
     */
    restrictedField?: string;

    /**
     * The value to search against for the restricted field. The restricted field will need to be
     * provided for this option to work.
     */
    restrictedFieldValue?: string;

    /**
     * Group name to filter the results by.
     */
    group?: string;

    /**
     * The label and value will be determined by the option returned here.
     *
     * All of the options below are optional to help return a value/label.
     *
     * @param selected The object returned by the Elastic search. (From the source.)
     * @param selectedNoType useful when you want to use included fields or fields that are not
     *                       mapped in our typescript types.
     * @param searchTerm The search term used to search for the selected object. Can be useful for
     *                   displaying custom options.
     * @return The label and value to use for the suggestion.
     */
    option: (
      selected: PersistedResource<T>,
      searchTerm: string
    ) => DropdownItem;
  };

  /**
   * JSON Api backend configuration.
   *
   * For example, this can be used for the collection-api.
   *
   * Leave undefined if you don't want to use JSON Api for suggestions.
   */
  jsonApiBackend?: {
    /**
     * The JSON Api query to use. Here you can define the path, the filters, and the sort options.
     *
     * @param searchTerm The search term provided in the text field. Useful for filters.
     * @param formikContext The formik context. Can be used to get existing fields on the form.
     */
    query: (
      searchTerm: string,
      formikCtx: FormikContextType<any>
    ) => JsonApiQuerySpec;

    /**
     * The label and value will be determined by the option returned here.
     *
     * All of the options below are optional to help return a value/label.
     *
     * @param selected The object returned by the Elastic search. (From the source.)
     * @param selectedNoType useful when you want to use included fields or fields that are not
     *                       mapped in our typescript types.
     * @param searchTerm The search term used to search for the selected object. Can be useful for
     *                   displaying custom options.
     * @return The label and value to use for the suggestion.
     */
    option: (
      selected: PersistedResource<T>,
      searchTerm: string
    ) => DropdownItem;
  };

  /**
   * If both backend options are defined, this will be used to determine which backend to use first.
   *
   * If the preferred backend fails then the other backend will be used.
   *
   * This does not need to be defined if only one backend is defined.
   */
  preferredBackend?: BackendOptions;

  /**
   * When the user first clicks on the text field, this will be used to determine the backend used.
   *
   * This will override the preferred backend. This can be useful if you have a backend that is
   * for displaying recent items and you want to use it for the initial search.
   *
   * If both providers can be used then you can use the "preferred" option.
   *
   * If not defined, then no provider will be used for blank searches.
   */
  blankSearchBackend?: BackendOptions | "preferred";

  /**
   * Milliseconds to wait before performing a search. This is used for the query debounce to
   * limit the number of queries performed.
   *
   * Default is 250 milliseconds if left undefined.
   */
  timeoutMs?: number;

  /**
   * Add custom options to the top of the suggestion lists. This will be added to the provided
   * suggestions from the backend providers.
   *
   * @param searchTerm The search term provided in the text field. Useful for filters.
   * @param formikContext The formik context. Can be used to get existing fields on the form.
   */
  customOptions?: (
    searchTerm: string,
    formikCtx: FormikContextType<any>
  ) => DropdownItem;

  /**
   * Event is triggered when a suggestion is selected.
   */
  onSuggestionSelected?: OnFormikSubmit<ChangeEvent<HTMLInputElement>>;
}

/**
 * Suggests type ahead values based on a back-end query.
 *
 * It can be configured to use Elastic search or JSON Api or both. It will use the preferred backend
 * first, then the other backend if the preferred backend fails. It will also use the blank search
 * backend if the user has not typed anything in the text field if provided.
 */
export function AutoSuggestTextField<T extends KitsuResource>({
  elasticSearchBackend,
  jsonApiBackend,
  preferredBackend,
  blankSearchBackend,
  timeoutMs = 250,
  customOptions,
  onSuggestionSelected,
  ...textFieldProps
}: AutoSuggestTextFieldProps<T>) {
  const { formatMessage } = useIntl();

  return (
    <TextField
      {...textFieldProps}
      customInput={(inputProps) => (
        <AutoSuggestTextFieldInternal
          elasticSearchBackend={elasticSearchBackend}
          jsonApiBackend={jsonApiBackend}
          preferredBackend={preferredBackend}
          blankSearchBackend={blankSearchBackend}
          customOptions={customOptions}
          {...inputProps}
          placeholder={
            inputProps.placeholder || formatMessage({ id: "typeHereToSearch" })
          }
          autoComplete="none"
          onSuggestionSelected={onSuggestionSelected}
          id={textFieldProps.name}
          timeoutMs={timeoutMs}
        />
      )}
    />
  );
}

function AutoSuggestTextFieldInternal<T extends KitsuResource>({
  elasticSearchBackend,
  jsonApiBackend,
  preferredBackend,
  blankSearchBackend,
  timeoutMs = 250,
  customOptions,
  onSuggestionSelected,
  id,
  ...inputProps
}: InputHTMLAttributes<any> & AutoSuggestConfig<T>) {
  const formik = useFormikContext<any>();

  // Backend currently being used, determined by the preferred backend or what is provided.
  const [backend, setBackend] = useState<BackendOptions>(
    preferredBackend
      ? preferredBackend
      : elasticSearchBackend
      ? "elastic-search"
      : "json-api"
  );

  // Value of the text field, used to search for suggestions.
  const [searchValue, setSearchValue] = useState<string>("");

  // Debounced version of the search value. This is used to limit the number of queries. The timeout
  // can be configured in the props.
  const [debouncedSearchValue] = timeoutMs
    ? useDebounce(searchValue, timeoutMs)
    : [searchValue];

  // Boolean to determine if the suggestion text field currently being used.
  const [focus, setFocus] = useState<boolean>(false);

  /**
   * Logic to determine which backend should be searched on.
   *
   * 1. Do not perform any searches if no backend providers are supplied.
   * 2. Focus must be provided on the text field.
   * 3. If a blank search is being performed...
   *   a. If a blank search backend is preferred then use the currently selected backend.
   *   b. If a blank search backend is not preferred then use the backendProvider only.
   * 4. If a non-blank search is being performed...
   *   a. Check if elastic search is currently being used, if it's defined, use that.
   *   b. If elastic search is not defined, use the JSON Api backend if it's defined.
   *
   * @param backendProvider The backend provider to check if it can be used.
   * @returns boolean indicating if the backend can be used based on the conditions above.
   */
  const performProviderSearch = (backendProvider: BackendOptions) => {
    // Don't perform any search if no providers are supplied.
    if (elasticSearchBackend === undefined && jsonApiBackend === undefined) {
      return false;
    }

    // If the text field is not focused, don't perform any search.
    if (!focus) {
      return false;
    }

    // Special case for blank searches if blank search backend is provided.
    if (searchValue === "") {
      if (
        blankSearchBackend &&
        ((blankSearchBackend === "preferred" && backendProvider === backend) ||
          blankSearchBackend === backendProvider)
      ) {
        return true;
      }
    } else {
      if (backend === backendProvider) {
        if (
          (backend === "elastic-search" &&
            elasticSearchBackend !== undefined) ||
          (backend === "json-api" && jsonApiBackend !== undefined)
        ) {
          return true;
        }
      }
    }

    // Do not perform the search if any of the conditions above are not met.
    return false;
  };

  // Default query specifications for the JSON API search.
  const querySpec: JsonApiQuerySpec = {
    path: "",
    sort: "-createdOn",
    ...jsonApiBackend?.query?.(debouncedSearchValue, formik)
  };

  // JSON API search. Only used if JSON Api is defined and it's the current backend.
  const {
    loading: jsonApiLoading,
    response: jsonApiResponse,
    error: jsonApiError,
    isDisabled: jsonApiIsDisabled
  } = useQuery<T[]>(querySpec, {
    disabled: !performProviderSearch("json-api")
  });

  // Elastic search search. Only used if Elastic Search is defined and it's the current backend.
  const {
    setInputValue,
    isLoading: elasticSearchLoading,
    searchResult: elasticSearchResult,
    error: elasticSearchError
  } = useAutocompleteSearch<T>({
    indexName: elasticSearchBackend?.indexName ?? "",
    searchField: elasticSearchBackend?.searchField ?? "",
    additionalField: elasticSearchBackend?.additionalSearchField,
    restrictedField: elasticSearchBackend?.restrictedField,
    restrictedFieldValue: elasticSearchBackend?.restrictedFieldValue,
    group: elasticSearchBackend?.group,
    timeoutMs: 0, // Timeout is already being handled by our debounce.
    disabled: !performProviderSearch("elastic-search")
  });

  // Put the ResourceSelect's input into the Search hook's for elastic search.
  useEffect(() => setInputValue(debouncedSearchValue), [debouncedSearchValue]);

  // Remove the role from react auto suggest generated div to fix WCAG issues, see #23517.
  useEffect(() => {
    const autosuggestGeneratedDivs =
      document?.querySelectorAll<any>(".autosuggest div");
    autosuggestGeneratedDivs?.forEach((element) => {
      if (element.attributes.role) {
        element.attributes.role.nodeValue = "";
      }
    });
  }, []);

  // If any errors occur, switch providers. Only if both providers are set.
  useEffect(() => {
    if (backend === "elastic-search" && elasticSearchError && jsonApiBackend) {
      setBackend("json-api");
      return;
    }

    if (backend === "json-api" && jsonApiError && elasticSearchBackend) {
      setBackend("elastic-search");
      return;
    }
  }, [elasticSearchError, jsonApiError]);

  const isLoading: boolean =
    elasticSearchLoading || (jsonApiLoading && !jsonApiIsDisabled);

  const searchResult: PersistedResource<T>[] | undefined =
    backend === "elastic-search"
      ? elasticSearchResult !== null
        ? elasticSearchResult
        : []
      : jsonApiResponse?.data;

  // Finally, the suggestions to be displayed on the dropdown.
  const allSuggestions = compact([
    ...(customOptions?.(searchValue, formik) || []),
    ...(searchResult && !isLoading && focus
      ? uniq(
          castArray(searchResult).flatMap((item) => {
            if (performProviderSearch("elastic-search")) {
              return elasticSearchBackend?.option(item, debouncedSearchValue);
            }
            if (performProviderSearch("json-api")) {
              return jsonApiBackend?.option(item, debouncedSearchValue);
            }
          })
        )
      : [])
  ]);

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
          getSuggestionValue={(s) => s}
          onSuggestionsFetchRequested={({ value }) => setSearchValue(value)}
          onSuggestionSelected={(_, data) => {
            inputProps.onChange?.({
              target: { value: data.suggestion }
            } as any);
            onSuggestionSelected?.(data.suggestion, formik);
          }}
          onSuggestionsClearRequested={() => setSearchValue("")}
          renderSuggestion={(text) => <div>{text}</div>}
          shouldRenderSuggestions={
            blankSearchBackend ? () => !!blankSearchBackend : undefined
          }
          inputProps={{
            onFocus: () => setFocus(true),
            onBlur: () => setFocus(false),
            ...(inputProps as InputProps<any>)
          }}
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
