import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { debounce, uniq } from "lodash";
import {
  createContext,
  InputHTMLAttributes,
  useCallback,
  useContext,
  useState
} from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";

export type AutoSuggestTextFieldProps<
  T extends KitsuResource
> = TextFieldProps & AutoSuggestContextI<T>;

interface AutoSuggestContextI<T extends KitsuResource> {
  query: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec;
  suggestion: (resource: PersistedResource<T>) => string;
}

const AutoSuggestContext = createContext<AutoSuggestContextI<any>>(null as any);

/**
 * Suggests typeahead values based on a back-end query.
 * The suggestion values are taken from each returned API resource.
 */
export function AutoSuggestTextField<T extends KitsuResource>({
  query,
  suggestion,
  ...textFieldProps
}: AutoSuggestTextFieldProps<T>) {
  return (
    <AutoSuggestContext.Provider value={{ query, suggestion }}>
      <TextField
        {...textFieldProps}
        CustomInput={AutoSuggestTextFieldInternal}
      />
    </AutoSuggestContext.Provider>
  );
}

function AutoSuggestTextFieldInternal<T extends KitsuResource>(
  inputProps: InputHTMLAttributes<any>
) {
  const formikCtx = useFormikContext<any>();
  const { query, suggestion } = useContext(AutoSuggestContext);

  const [searchValue, setSearchValue] = useState("");
  const debouncedSetSearchValue = useCallback(
    debounce(setSearchValue, 250),
    []
  );

  const { loading, response } = useQuery<T[]>(query(searchValue, formikCtx));

  const suggestions =
    searchValue && !loading ? uniq((response?.data ?? []).map(suggestion)) : [];

  return (
    <>
      <style>{`
        .autosuggest-container-open {      
            position: absolute;
            z-index: 2; 
            margin: 0 0 0 -15px; 
         },
        .container {
           display:none;
        }
        .autosuggest-highlighted { 
          background-color: #ddd; 
        }

        `}</style>
      <AutoSuggest
        suggestions={suggestions}
        getSuggestionValue={s => s}
        onSuggestionsFetchRequested={({ value }) =>
          debouncedSetSearchValue(value)
        }
        onSuggestionSelected={(_, data) =>
          inputProps.onChange?.({ target: { value: data.suggestion } } as any)
        }
        onSuggestionsClearRequested={() => {
          debouncedSetSearchValue.cancel();
          debouncedSetSearchValue("");
        }}
        renderSuggestion={text => <div>{text}</div>}
        inputProps={inputProps as InputProps<any>}
        theme={{
          suggestionsList: "list-group",
          suggestion: "list-group-item",
          suggestionHighlighted: "autosuggest-highlighted",
          suggestionsContainerOpen: "autosuggest-container-open",
          suggestionsContainer: "container"
        }}
      />
    </>
  );
}
