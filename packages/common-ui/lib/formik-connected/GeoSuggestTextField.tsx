import { LoadingSpinner, TextField, TextFieldProps } from "common-ui";
import { noop } from "lodash";
import { FormEvent, InputHTMLAttributes, useState } from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";
import useSWR from "swr";
import { CommonMessage } from "../intl/common-ui-intl";
import { KeyboardEventHandlerWrapper } from "../keyboard-event-handler/KeyboardEventHandlerWrappedTextField";
import { Tooltip } from "../tooltip/Tooltip";

export type GeoSuggestTextFieldProps = TextFieldProps & GeoSuggestProps;

export interface GeoSuggestProps {
  /** Fetches json from a url. */
  fetchJson?: (url: string) => Promise<any>;
}

export interface NominatumApiSearchResult {
  display_name: string;
  category: string;
  type: string;
}

/**
 * Suggests typeahead values based on a back-end query.
 * The suggestion values are taken from each returned API resource.
 */
export function GeoSuggestTextField({
  fetchJson,
  ...textFieldProps
}: GeoSuggestTextFieldProps) {
  return (
    <TextField
      {...textFieldProps}
      customInput={inputProps => (
        <GeoSuggestTextFieldInternal
          fetchJson={fetchJson}
          {...(inputProps as any)}
        />
      )}
    />
  );
}

type GeoSuggestTextFieldInternalProps = InputHTMLAttributes<any> &
  GeoSuggestProps;

function GeoSuggestTextFieldInternal({
  fetchJson = url => window.fetch(url).then(res => res.json()),
  ...inputProps
}: GeoSuggestTextFieldInternalProps) {
  const [geoSearchValue, setGeoSearchValue] = useState("");

  /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
  const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);

  async function doGeoSearch() {
    setGeoSearchValue(String(inputProps.value));

    // Set a 1-second API request throttle:
    setGeoApiRequestsOnHold(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setGeoApiRequestsOnHold(false);
  }

  async function nominatimFetcher(
    searchValue: string
  ): Promise<NominatumApiSearchResult[]> {
    if (!searchValue?.trim()) {
      return [];
    }

    const url = new URL("https://nominatim.openstreetmap.org/search.php");
    url.search = new URLSearchParams({
      q: searchValue,
      format: "jsonv2"
    }).toString();

    try {
      const results = await fetchJson(url.toString());
      return results as NominatumApiSearchResult[];
    } catch (error) {
      return [];
    }
  }

  /** Clears the suggestions when the value changes. */
  function onChangeInternal(event: FormEvent<any>) {
    setGeoSearchValue("");
    inputProps.onChange?.(event);
  }

  const {
    data: searchResults = [],
    isValidating: suggestionsAreLoading
  } = useSWR<NominatumApiSearchResult[]>([geoSearchValue, "geo-search"], {
    fetcher: nominatimFetcher,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Filter results down to administrative boundaries:
  const administrativeBoundaries = searchResults.filter(
    result => result.category === "boundary" && result.type === "administrative"
  );

  const suggestions = administrativeBoundaries.map(
    result => result.display_name
  );

  const geoButtonDisabled = geoApiRequestsOnHold || !inputProps.value;

  return (
    <div>
      <style>{`.autosuggest-highlighted { background-color: #ddd; }`}</style>
      <KeyboardEventHandlerWrapper onChange={inputProps.onChange}>
        <AutoSuggest
          suggestions={suggestions}
          getSuggestionValue={s => s}
          onSuggestionsClearRequested={() => setGeoSearchValue("")}
          onSuggestionsFetchRequested={noop}
          onSuggestionSelected={(_, data) =>
            inputProps.onChange?.({ target: { value: data.suggestion } } as any)
          }
          renderSuggestion={text => <div>{text}</div>}
          renderInputComponent={props => (
            <textarea rows={3} {...(props as any)} />
          )}
          inputProps={{
            ...(inputProps as InputProps<any>),
            onChange: onChangeInternal
          }}
          theme={{
            suggestionsList: "list-group",
            suggestion: "list-group-item",
            suggestionHighlighted: "autosuggest-highlighted"
          }}
        />
      </KeyboardEventHandlerWrapper>
      {!suggestions.length && (
        // Only show the geo-suggest button when the previous suggestion box is closed.
        <div className="form-group">
          <div className="float-right">
            {suggestionsAreLoading ? (
              <LoadingSpinner loading={true} />
            ) : (
              <button
                type="button"
                className="btn btn-info geo-suggest-button"
                disabled={geoButtonDisabled}
                onClick={doGeoSearch}
              >
                <CommonMessage id="geoSuggest" />
              </button>
            )}
            <Tooltip id="geoSuggestTooltip" />
          </div>
        </div>
      )}
    </div>
  );
}
