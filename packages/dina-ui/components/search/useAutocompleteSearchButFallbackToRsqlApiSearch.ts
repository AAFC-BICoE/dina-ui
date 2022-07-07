import { JsonApiQuerySpec, useQuery } from "common-ui";
import { KitsuResource } from "kitsu";
import { useEffect } from "react";
import { AutocompleteSearchParams, useAutocompleteSearch } from "./useSearch";

export interface UseAutocompleteSearchButFallbackToRsqlApiSearchProps
  extends AutocompleteSearchParams {
  searchQuery: string;
  querySpec: JsonApiQuerySpec;
}

/**
 * Try to use the Search API but fall back to the regular RSQL API if that fails or returns no results.
 */
export function useAutocompleteSearchButFallbackToRsqlApiSearch<
  T extends KitsuResource
>({
  indexName,
  searchQuery,
  querySpec,
  additionalField,
  documentId,
  searchField,
  restrictedField,
  restrictedFieldValue
}: UseAutocompleteSearchButFallbackToRsqlApiSearchProps) {
  const {
    setInputValue,
    isLoading: searchLoading,
    searchResult,
    error: searchApiError
  } = useAutocompleteSearch<T>({
    indexName,
    searchField,
    additionalField,
    documentId,
    restrictedField,
    restrictedFieldValue
  });
  // When search result has empty array of hits, it should be considered as normal
  const searchApiFailed = !searchResult || searchApiError;
  const searchApiIsDown = !!sessionStorage.getItem("searchApiDown");

  const fallbackToRsqlApi = searchApiFailed || !searchQuery || searchApiIsDown;

  // Use the API query with RSQL as a fallback if Search API returns empty:
  const { loading: apiLoading, response: apiResponse } = useQuery<T[]>(
    querySpec,
    { disabled: !fallbackToRsqlApi }
  );

  // Put the ResourceSelect's input into the Search hook's state:
  useEffect(() => setInputValue(searchQuery), [searchQuery]);

  // If the SearchApi is for one request then stop waiting for its
  // responses within the current browser tab (Session storage).
  // TODO Remove this later if the search-api has better uptime in local dev:
  useEffect(() => {
    if (searchApiError?.message?.startsWith?.("Service unavailable")) {
      sessionStorage.setItem("searchApiDown", "true");
    } else if (searchResult?.length) {
      sessionStorage.removeItem("searchApiDown");
    }
  }, [searchApiError, searchResult]);

  return {
    loading: (!searchApiIsDown && searchLoading) || apiLoading,
    response: {
      data: [...(searchResult ?? []), ...(apiResponse?.data ?? [])]
    }
  };
}
