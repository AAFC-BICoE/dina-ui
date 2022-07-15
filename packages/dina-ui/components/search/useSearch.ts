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
    fetcher: searchValue =>
      doSearch<T>(apiClient.axios, { ...doSearchParams, searchValue }),
    timeoutMs: 250
  });
}

export interface DoSearchParams {
  searchField: string;
  indexName: string;
  searchValue?: string;
  additionalField?: string;
  documentId?: string;
  restrictedField?: string;
  restrictedFieldValue?: string;
  groups?: string[];

  /**
   * If the result is coming from the included section, this needs to be turned on.
   */
  includedSection?: boolean;
  disabled?: boolean;
}

/** Does the search against the search API. */
export async function doSearch<T extends KitsuResource>(
  axios: Pick<AxiosInstance, "get">,
  {
    indexName,
    searchField,
    searchValue,
    documentId,
    additionalField,
    restrictedField,
    restrictedFieldValue,
    groups,
    disabled = false,
    includedSection = false
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
        documentId,
        indexName,
        groups,
        ...restrictedFieldParams
      }
    }
  );

  const jsonApiDocs = compact(response.data.hits?.map(hit => hit.source));

  // Deserialize the responses to Kitsu format.
  const resources = await Promise.all(
    jsonApiDocs.map<Promise<PersistedResource<T>>>(async doc =>
      includedSection
        ? doc?.included?.[0]?.attributes
        : (
            await deserialise(doc)
          ).data
    )
  );

  return resources;
}
