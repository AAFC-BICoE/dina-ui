import { useEffect, useState } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

export interface UseThrottledFetchParams<TData> {
  fetcher: (query: string, ...deps: any[]) => Promise<TData>;
  timeoutMs: number;
  initSearchValue?: string;
  dependencies?: any[];
}

export function useThrottledFetch<TData>({
  fetcher,
  timeoutMs,
  initSearchValue,
  dependencies = []
}: UseThrottledFetchParams<TData>) {
  /** The value of the input element. */
  const [inputValue, setInputValue] = useState(initSearchValue ?? "");

  /**
   * The query passed to the API.
   * This state is only set when the user submits the search input.
   */
  const [searchValue, setSearchValue] = useState("");

  /**
   * Whether the Fetcher is throttled
   * to make sure we don't send more requests than we are allowed to.
   */
  const [throttled, setThrottled] = useState(false);

  useEffect(() => {
    if (searchValue) {
      setThrottled(true);
      const throttleReset = setTimeout(() => setThrottled(false), timeoutMs);
      return () => clearTimeout(throttleReset);
    }
  }, [searchValue, timeoutMs]);

  // Create the SWR key with search value and dependencies
  const swrKey = searchValue ? [searchValue, ...dependencies] : null;

  const { isLoading: searchIsLoading, data: mySearchResult } = useSWR(
    swrKey,
    () => fetcher(searchValue, ...dependencies),
    {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const searchResult: any = mySearchResult;
  const searchIsDisabled = throttled || !inputValue || searchIsLoading;

  /** Executes the search immediately and delays further calls. */
  function doThrottledSearch(scientificName) {
    // Set a 1-second API request throttle:
    if (searchIsDisabled && !scientificName) {
      return;
    }

    // Set the new search value which will make useSWR do the lookup:
    const value = scientificName?.length > 0 ? scientificName : inputValue;
    setInputValue(value);
    setSearchValue(value);
  }

  return {
    inputValue,
    setInputValue,
    searchIsDisabled,
    doThrottledSearch,
    searchResult,
    searchIsLoading
  };
}

export interface UseDebouncedFetchParams<TData> {
  fetcher: (query: string, ...deps: any[]) => Promise<TData>;
  timeoutMs: number;
  dependencies?: any[]; // Additional dependencies for SWR
}

export function useDebouncedFetch<TData>({
  fetcher,
  timeoutMs,
  dependencies = []
}: UseDebouncedFetchParams<TData>) {
  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /** The debounced input value passed to the fetcher. */
  const [searchValue, { isPending }] = useDebounce(inputValue, timeoutMs);

  // Create the SWR key with search value and dependencies
  const swrKey = searchValue ? [searchValue, ...dependencies] : null;

  const {
    isLoading: searchIsLoading,
    data: searchResult,
    error
  } = useSWR(swrKey, () => fetcher(searchValue, ...dependencies), {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const isLoading = !!inputValue && (searchIsLoading || isPending());

  return {
    inputValue,
    setInputValue,
    isLoading,
    searchResult,
    error
  };
}
