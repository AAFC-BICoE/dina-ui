import { JsonTree } from "@react-awesome-query-builder/ui";

/**
 * The current version of the saved search, this should change if the structure changes.
 */
export const SAVED_SEARCH_VERSION = 3;

/**
 * Since saved searches are stored as JSON this is the structure to be used.
 */
export interface SavedSearchStructure {
  [indexName: string]: {
    [savedSearchName: string]: SingleSavedSearch;
  };
}

export interface SingleSavedSearch {
  // This field is not saved in the JSON.
  savedSearchName?: string;

  /**
   * Current version of the saved search structured.
   */
  version?: number;

  /**
   * Mark as the default search.
   */
  default: boolean;

  /**
   * Query builder structure.
   */
  queryTree?: JsonTree;

  /**
   * Selected columns visibility structure.
   */
  columnVisibility?: string[];

  /**
   * Groups to load in.
   */
  groups: string[];
}
