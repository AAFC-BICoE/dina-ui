import { AxiosInstance } from "axios";
import { useApiClient, useDebouncedFetch } from "common-ui";
import { DocWithData } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { compact } from "lodash";

// The parts of the API response used by this component:
export interface AutocompleteSearchResponse {
  hits?: {
    hits?: {
      id?: string;
      index?: string;
      sourceAsMap?: DocWithData;
    }[];
  };
}

export interface AutocompleteSearchParams {
  type?: string;
  autoCompleteField;
}

export function useAutocompleteSearch<T extends KitsuResource>(type?: string) {
  const { apiClient } = useApiClient();

  return useDebouncedFetch({
    fetcher: searchValue => doSearch<T>(apiClient.axios, searchValue),
    timeoutMs: 250
  });
}

/** Does the search against the search API. */
export async function doSearch<T extends KitsuResource>(
  axios: Pick<AxiosInstance, "get">,
  searchValue?: string
) {
  if (!searchValue) {
    return null;
  }

  const response = await axios.get<AutocompleteSearchResponse>(
    "search-api/search/auto-complete",
    {
      params: {
        prefix: searchValue,
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
    jsonApiDocs.map<Promise<T>>(async doc => (await deserialise(doc)).data)
  );

  return resources;
}
