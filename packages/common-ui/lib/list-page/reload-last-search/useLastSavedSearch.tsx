import { useLocalStorage } from "@rehooks/local-storage";
import { useEffect, useState } from "react";
import { ImmutableTree, JsonTree, Utils } from "react-awesome-query-builder";

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
}

export function useLastSavedSearch({
  setQueryBuilderTree,
  setSubmittedQueryBuilderTree,
  performSubmit,
  uniqueName
}: UseLastSavedSearchProps): UseLastSavedSearchReturn {
  const localStorageLastUsedTreeKey = uniqueName + "-last-used-tree";

  const [queryLoaded, setQueryLoaded] = useState<boolean>(false);

  const [localStorageQueryTree, setLocalStorageQueryTree] =
    useLocalStorage<JsonTree>(localStorageLastUsedTreeKey);

  // Load in the last used save search
  useEffect(() => {
    if (localStorageQueryTree) {
      setQueryBuilderTree(Utils.loadTree(localStorageQueryTree as JsonTree));
      setQueryLoaded(true);
      setSubmittedQueryBuilderTree(
        Utils.loadTree(localStorageQueryTree as JsonTree)
      );
    } else {
      // Nothing to load in, mark as loaded.
      setQueryLoaded(true);
    }
  }, []);

  // Once the query builder tree has been loaded in, perform a submit.
  useEffect(() => {
    if (localStorageQueryTree) {
      setSubmittedQueryBuilderTree(
        Utils.loadTree(localStorageQueryTree as JsonTree)
      );
    } else {
      performSubmit();
    }
  }, [queryLoaded]);

  return {
    loadLastUsed: !!localStorageQueryTree
  };
}
