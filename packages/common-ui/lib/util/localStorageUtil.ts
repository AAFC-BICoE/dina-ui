import { useState } from "react";

/**
 * Helper function to store an array of items into local storage.
 *
 * The array of items will be converted into JSON.
 *
 * @param key
 * @param items
 */
export function setArray(key: string, items: any[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

interface UseLocalStorageProps {
  /**
   * The key string value to find the items in LocalStorage.
   */
  key: string;

  /**
   * If supplied, if nothing was saved, the default value will be returned.
   */
  defaultValue?: any;

  /**
   * Default is false. If true, after it has been retrieved the value will be removed from
   * LocalStorage.
   */
  removeAfterRetrieval?: boolean;
}

/**
 * React hook that stores a state using a local storage key.
 *
 * ! Important: The stored item needs to be in a JSON format. !
 */
export const useLocalStorage = ({
  key,
  defaultValue,
  removeAfterRetrieval
}: UseLocalStorageProps) => {
  const [value] = useState(() => {
    const item = localStorage.getItem(key);

    // Clear the item from local storage if requested.
    if (removeAfterRetrieval === true) {
      localStorage.removeItem(key);
    }

    return item ? JSON.parse(item) : defaultValue ?? null;
  });

  return value;
};
