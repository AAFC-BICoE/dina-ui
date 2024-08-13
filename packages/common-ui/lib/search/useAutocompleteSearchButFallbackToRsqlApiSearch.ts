import { JsonApiQuerySpec, useQuery } from "common-ui";
import { KitsuResource } from "kitsu";
import { useEffect, useState } from "react";
import { AutocompleteSearchParams, useAutocompleteSearch } from "./useSearch";

export interface UseAutocompleteSearchButFallbackToRsqlApiSearchProps
  extends AutocompleteSearchParams {
  searchQuery: string;
  querySpec: JsonApiQuerySpec;
}

/**
 * Different modes to use for the resource selection options.
 */
export type ApiModeType = "elasticsearch" | "rsql";

/**
 * Try to use the Search API but fall back to the regular RSQL API if that fails or returns no
 * results.
 *
 * Special case is when the search query is empty then the RSQL is used.
 */
export function useAutocompleteSearchButFallbackToRsqlApiSearch<
  T extends KitsuResource
>({
  indexName,
  searchQuery,
  querySpec,
  additionalField,
  searchField,
  restrictedField,
  restrictedFieldValue
}: UseAutocompleteSearchButFallbackToRsqlApiSearchProps) {
  // The mode indicates which API is being used. Either RSQL or Elastic Search.
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
    // If Elasticsearch fails, fall back to the RSQL API.
    setApiMode("rsql");
  }

  // Use the API query with RSQL as a fallback if Search API returns empty:
  const { loading: rsqlSearchLoading, response: rsqlSearchResponse } = useQuery<
    T[]
  >(querySpec, { disabled: searchQuery === "" ? false : apiMode !== "rsql" });

  // Put the ResourceSelect's input into the Search hook's state:
  useEffect(() => setInputValue(searchQuery), [searchQuery]);

  return {
    loading: elasticSearchLoading || rsqlSearchLoading,
    response: {
      data: [
        ...(elasticSearchResult ?? []),
        ...(rsqlSearchResponse?.data ?? [])
      ]
    }
  };
}
