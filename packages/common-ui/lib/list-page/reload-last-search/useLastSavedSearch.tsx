import { useEffect, useState } from "react";
import {
  ImmutableTree,
  JsonTree,
  Utils
} from "@react-awesome-query-builder/ui";
import { useSessionStorage } from "usehooks-ts";
import { defaultJsonTree } from "../..";
import { createSessionStorageLastUsedTreeKey } from "../saved-searches/SavedSearch";

interface UseLastSavedSearchProps {
  /**
   * Set the query builder tree, used to to load a saved search.
   */
  setQueryBuilderTree: (newTree: ImmutableTree) => void;

  /**
   * Set the submitted query builder tree, used to to load a saved search.
   */
  setSubmittedQueryBuilderTree: React.Dispatch<
    React.SetStateAction<ImmutableTree>
  >;

  /**
   * For the last loaded search, we will actually perform the search by calling this callback
   * function.
   */
  performSubmit: () => void;

  /**
   * Used for generating the local storage keys. Every instance of the QueryPage should have it's
   * own unique name.
   *
   * In special cases where you want the sorting, pagination, column selection and other features
   * to remain the same across tables, it can share the same name.
   */
  uniqueName: string;
}

interface UseLastSavedSearchReturn {
  // If the `reloadLastSearch` url param is present.
  loadLastUsed: boolean;

  // Function to trigger the load of the last loaded search. This will be ran if the default
  // search has not been loaded in.
  loadLastSavedSearch: () => void;
}

export function useLastSavedSearch({
  setQueryBuilderTree,
  setSubmittedQueryBuilderTree,
  performSubmit,
  uniqueName
}: UseLastSavedSearchProps): UseLastSavedSearchReturn {
  const [queryLoaded, setQueryLoaded] = useState<boolean>(false);

  const [sessionStorageQueryTree] = useSessionStorage<JsonTree>(
    createSessionStorageLastUsedTreeKey(uniqueName),
    defaultJsonTree
  );

  const loadLastSavedSearch = () => {
    setQueryLoaded(true);
  };

  // Once the query builder tree has been loaded in, perform a submit.
  useEffect(() => {
    if (sessionStorageQueryTree) {
      setQueryBuilderTree(Utils.loadTree(sessionStorageQueryTree as JsonTree));
      setSubmittedQueryBuilderTree(
        Utils.loadTree(sessionStorageQueryTree as JsonTree)
      );
    } else {
      performSubmit();
    }
  }, [queryLoaded]);

  return {
    loadLastUsed: !!sessionStorageQueryTree,
    loadLastSavedSearch
  };
}
