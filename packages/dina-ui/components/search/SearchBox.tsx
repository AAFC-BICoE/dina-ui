import { DocWithData } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { compact, debounce, get } from "lodash";
import { useCallback, useState } from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";
import useSWR from "swr";
import { useApiClient } from "../../../common-ui/lib";
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
function getLink(resource: KitsuResource): SearchLink {
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

export interface SearchLink {
  link?: string;
  name: string;
}

export function SearchBox({ inputProps }: SearchBoxProps) {
  const { apiClient } = useApiClient();

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

  async function doSearch(): Promise<SearchLink[]> {
    if (!search.value) {
      return [];
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

  return (
    <div>
      <style>{`
        .autosuggest-container-open {      
          position: absolute;
          z-index: 2; 
          margin: 0 0 0 -15px; 
        },
        .autosuggest-container {
            display: none;
        }
        .autosuggest-highlighted { 
          background-color: #ddd;
        }
      `}</style>
      <AutoSuggest<SearchLink>
        onSuggestionsFetchRequested={({ value }) =>
          debouncedSearchUpdate(value)
        }
        suggestions={data ?? []}
        getSuggestionValue={s => s.name}
        renderSuggestion={text => <div>{text.name}</div>}
        inputProps={{
          className: "form-control",
          ...inputProps,

          onChange: (_, { newValue }) =>
            setSearch(val => ({ ...val, input: newValue })),
          value: search.input
        }}
        theme={{
          suggestionsList: "list-group",
          suggestion: "list-group-item",
          suggestionHighlighted: "autosuggest-highlighted",
          suggestionsContainerOpen: "autosuggest-container-open",
          suggestionsContainer: "autosuggest-container"
        }}
      />
    </div>
  );
}
