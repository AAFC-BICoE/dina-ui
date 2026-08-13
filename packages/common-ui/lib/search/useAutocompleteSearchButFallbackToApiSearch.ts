import { JsonApiQuerySpec, useQuery } from "common-ui";
import { KitsuResource } from "kitsu";
import { useEffect, useState } from "react";
import { AutocompleteSearchParams, useAutocompleteSearch } from "./useSearch";

export interface UseAutocompleteSearchButFallbackToApiSearchProps
  extends AutocompleteSearchParams {
  searchQuery: string;
  querySpec: JsonApiQuerySpec;
}

/**
 * Different modes to use for the resource selection options.
 *
 * "elasticsearch" means the Search API is being used, "api" means the regular API is being used.
 */
export type ApiModeType = "elasticsearch" | "api";

/**
 * Try to use the Search API but fall back to the regular API if that fails or returns no
 * results.
 *
 * Special case is when the search query is empty then the API is used.
 */
export function useAutocompleteSearchButFallbackToApiSearch<
  T extends KitsuResource
>({
  indexName,
  searchQuery,
  querySpec,
  additionalField,
  searchField,
  restrictedField,
  restrictedFieldValue
}: UseAutocompleteSearchButFallbackToApiSearchProps) {
  // The mode indicates which API is being used. Either API or Elastic Search.
  const [apiMode, setApiMode] = useState<ApiModeType>("elasticsearch");

  // Elastic search autocomplete
  const {
    setInputValue,
    isLoading: elasticSearchLoading,
    searchResult: elasticSearchResult,
    error: elasticSearchError
  } = useAutocompleteSearch<T>({
    indexName,
    searchField,
    additionalField,
    restrictedField,
    restrictedFieldValue,
    disabled: searchQuery === "" ? true : apiMode !== "elasticsearch"
  });

  if (elasticSearchError && apiMode === "elasticsearch") {
    // If Elasticsearch fails, fall back to the API.
    setApiMode("api");
  }

  // Use the API query as a fallback if Search API returns empty:
  const { loading: apiSearchLoading, response: apiSearchResponse } = useQuery<
    T[]
  >(querySpec, { disabled: searchQuery === "" ? false : apiMode !== "api" });

  // Put the ResourceSelect's input into the Search hook's state:
  useEffect(() => setInputValue(searchQuery), [searchQuery]);

  return {
    loading: elasticSearchLoading || apiSearchLoading,
    response: {
      data: [...(elasticSearchResult ?? []), ...(apiSearchResponse?.data ?? [])]
    }
  };
}
