import { useEffect, useState } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

export interface UseThrottledFetchParams<TData> {
  fetcher: (query: string) => Promise<TData>;
  timeoutMs: number;
}

export function useThrottledFetch<TData>({
  fetcher,
  timeoutMs
}: UseThrottledFetchParams<TData>) {
  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /**
   * The query passed to the Catalogue of Life API.
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
  }, [searchValue]);

  const { isValidating: searchIsLoading, data: searchResult } = useSWR(
    [searchValue],
    () => fetcher(searchValue),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const searchIsDisabled = throttled || !inputValue || searchIsLoading;

  /** Executes the search immediately and delays further calls. */
  function doThrottledSearch() {
    // Set a 1-second API request throttle:
    if (searchIsDisabled) {
      return;
    }

    // Set the new search value which will make useSWR do the lookup:
    setSearchValue(inputValue);
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

export function useDebouncedFetch<TData>({
  fetcher,
  timeoutMs
}: UseThrottledFetchParams<TData>) {
  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /** The debounced input value passed to the fetcher. */
  const [searchValue, { isPending }] = useDebounce(inputValue, timeoutMs);

  const { isValidating: searchIsLoading, data: searchResult } = useSWR(
    [searchValue],
    () => fetcher(searchValue),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const isLoading = !!inputValue && (searchIsLoading || isPending());

  return { inputValue, setInputValue, isLoading, searchResult };
}
