import {
  JsonApiQuerySpec,
  TextField,
  TextFieldProps,
  useQuery
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { debounce } from "lodash";
import { InputHTMLAttributes, useCallback, useMemo, useState } from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";

export interface AutoSuggestTextFieldProps<T extends KitsuResource>
  extends TextFieldProps {
  query: (
    searchValue: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec;
  suggestion: (resource: PersistedResource<T>) => string;
}

/**
 * Suggests typeahead values based on a back-end query.
 * The suggestion values are taken from each returned API resource.
 */
export function AutoSuggestTextField<T extends KitsuResource>({
  query,
  suggestion,
  ...textFieldProps
}: AutoSuggestTextFieldProps<T>) {
  const formikCtx = useFormikContext<any>();

  const AutoSuggestTextFieldInternal = useCallback(
    (inputProps: InputHTMLAttributes<any>) => {
      const [searchValue, setSearchValue] = useState("");
      const debouncedSetSearchValue = useMemo(
        () => debounce(setSearchValue, 250),
        []
      );

      const { loading, response } = useQuery<T[]>(
        query(searchValue, formikCtx)
      );

      const suggestions =
        searchValue && !loading ? (response?.data ?? []).map(suggestion) : [];

      return (
        <AutoSuggest
          suggestions={suggestions}
          getSuggestionValue={s => s}
          onSuggestionsFetchRequested={({ value }) =>
            debouncedSetSearchValue(value)
          }
          onSuggestionsClearRequested={() => {
            debouncedSetSearchValue.cancel();
            debouncedSetSearchValue("");
          }}
          renderSuggestion={text => <div>{text}</div>}
          inputProps={inputProps as InputProps<any>}
        />
      );
    },
    [JSON.stringify(query("test-string", formikCtx))]
  );

  return (
    <TextField {...textFieldProps} CustomInput={AutoSuggestTextFieldInternal} />
  );
}
