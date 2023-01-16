import { AxiosInstance } from "axios";
import { useApiClient, useDebouncedFetch } from "common-ui";
import { DocWithData } from "jsonapi-typescript";
import { KitsuResource, PersistedResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { compact } from "lodash";

// The parts of the API response used by this component:
export interface AutocompleteSearchResponse {
  hits?: {
    id?: string;
    index?: string;
    source?: DocWithData;
  }[];
}

export type AutocompleteSearchParams = Omit<DoSearchParams, "searchValue">;

export function useAutocompleteSearch<T extends KitsuResource>(
  doSearchParams: AutocompleteSearchParams
) {
  const { apiClient } = useApiClient();

  return useDebouncedFetch({
    fetcher: (searchValue) =>
      doSearch<T>(apiClient.axios, { ...doSearchParams, searchValue }),
    timeoutMs: doSearchParams.timeoutMs ?? 250
  });
}

export interface DoSearchParams {
  searchField: string;
  indexName: string;
  searchValue?: string;
  additionalField?: string;
  restrictedField?: string;
  restrictedFieldValue?: string;
  group?: string;
  disabled?: boolean;
  timeoutMs?: number;
}

/** Does the search against the search API. */
export async function doSearch<T extends KitsuResource>(
  axios: Pick<AxiosInstance, "get">,
  {
    indexName,
    searchField,
    searchValue,
    additionalField,
    restrictedField,
    restrictedFieldValue,
    group,
    disabled = false
  }: DoSearchParams
) {
  if (!searchValue || disabled) {
    return null;
  }

  const restrictedFieldParams = restrictedField
    ? {
        restrictedField,
        restrictedFieldValue
      }
    : {};

  const response = await axios.get<AutocompleteSearchResponse>(
    "search-api/search-ws/auto-complete",
    {
      params: {
        prefix: searchValue,
        autoCompleteField: searchField,
        additionalField,
        indexName,
        group,
        ...restrictedFieldParams
      }
    }
  );

  const jsonApiDocs = compact(
    response.data.hits?.map((hit) => {
      if (hit?.source?.included) {
        return { data: hit?.source?.included?.[0] };
      } else {
        return hit?.source;
      }
    })
  );

  // Deserialize the responses to Kitsu format.
  const resources = await Promise.all(
    jsonApiDocs.map<Promise<PersistedResource<T>>>(
      async (doc) => (await deserialise(doc)).data
    )
  );

  return resources;
}
