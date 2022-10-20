import { JsonTree } from "react-awesome-query-builder";

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
  default: boolean;
  queryTree?: JsonTree;
}
