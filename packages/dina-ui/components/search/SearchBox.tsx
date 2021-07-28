import { DocWithData } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { compact, debounce, get } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";
import useSWR from "swr";
import { LoadingSpinner, useApiClient } from "../../../common-ui/lib";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
export interface SearchBoxProps {
  inputProps?: InputProps<any>;
}

export interface AutocompleteSearchResponse {
  hits?: {
    hits?: {
      id?: string;
      index?: string;
      sourceAsMap?: DocWithData;
    }[];
  };
}

/**
 * Get the name and link for a resource.
 * This should be updated for any resource that doesn't have a "name" field.
 */
function getLink(resource: KitsuResource): SearchResult {
  const { id } = resource;

  switch (resource.type) {
    case "person":
      return {
        name: (resource as Person).displayName,
        link: `/person/view?id=${id}`
      };
  }

  return {
    name: get(resource, "name") ?? resource.id ?? String(resource)
  };
}

export interface SearchResult {
  link?: string;
  name: string;
}

export function SearchBox({ inputProps }: SearchBoxProps) {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const [search, setSearch] = useState({
    /** The user's typed input. */
    input: "",
    /** The actual search value, which is updated after a throttle to avoid excessive API requests. */
    value: ""
  });

  /** Updates the actual search value passed to the API. */
  const debouncedSearchUpdate = useCallback(
    debounce(
      (newValue: string) => setSearch({ input: newValue, value: newValue }),
      250
    ),
    []
  );

  async function doSearch(): Promise<SearchResult[] | null> {
    if (!search.value) {
      return null;
    }

    const response = await apiClient.axios.get<AutocompleteSearchResponse>(
      "search-api/search/auto-complete",
      {
        params: {
          prefix: search.value,
          autoCompleteField: "data.attributes.displayName",
          additionalField: "",
          indexName: "dina_document_index"
        }
      }
    );

    const jsonApiDocs = compact(
      response.data.hits?.hits?.map(hit => hit.sourceAsMap)
    );

    // Deserialize the responses to Kitsu format.
    const resources = await Promise.all(
      jsonApiDocs.map<Promise<KitsuResource>>(
        async doc => (await deserialise(doc)).data
      )
    );

    return resources.map(getLink);
  }

  const { data, error, isValidating } = useSWR([search.value], doSearch);

  function goToPage(link: string) {
    router.push(link);
  }

  return (
    <div className="dropdown autosuggest">
      <style>{`
        .autosuggest .dropdown-item {
          white-space: normal;
        }
        .autosuggest .suggestion-highlighted {
          background-color: #ddd;
        }
      `}</style>
      <AutoSuggest<SearchResult>
        onSuggestionsFetchRequested={({ value }) =>
          debouncedSearchUpdate(value)
        }
        suggestions={data ?? []}
        getSuggestionValue={() => search.input}
        highlightFirstSuggestion={true}
        renderSuggestionsContainer={({ containerProps, children }) => (
          <div {...containerProps}>
            {!!data?.length && children}
            {isValidating && (
              <div className="dropdown-menu w-100 d-inline">
                <div className="dropdown-item d-flex justify-content-center">
                  <LoadingSpinner loading={true} />
                </div>
              </div>
            )}
          </div>
        )}
        focusInputOnSuggestionClick={true}
        renderSuggestion={result =>
          result.link ? (
            <Link href={result.link}>
              <a>
                <div className="w-100">{result.name}</div>
              </a>
            </Link>
          ) : (
            result.name
          )
        }
        inputProps={{
          className: "form-control",
          placeholder: formatMessage("search"),
          ...inputProps,

          onChange: (_, { newValue }) =>
            setSearch(val => ({ ...val, input: newValue })),
          value: search.input
        }}
        onSuggestionSelected={(_, { suggestion }) =>
          suggestion.link && goToPage(suggestion.link)
        }
        theme={{
          suggestionsList: "dropdown-menu w-100 d-inline",
          suggestion: "dropdown-item",
          suggestionHighlighted: "suggestion-highlighted"
        }}
      />
    </div>
  );
}
