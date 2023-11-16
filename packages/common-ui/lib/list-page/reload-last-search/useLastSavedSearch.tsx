import { useLocalStorage } from "@rehooks/local-storage";
import { ColumnSort } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ImmutableTree, JsonTree, Utils } from "react-awesome-query-builder";

interface UseLastSavedSearchProps {
  /**
   * The index name is used to find the local storage query tree.
   */
  indexName: string;

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
   * Set the page offset, used to to load a saved search.
   */
  setPageOffset: React.Dispatch<React.SetStateAction<number>>;

  /**
   * For the last loaded search, we will actually perform the search by calling this callback
   * function.
   */
  performSubmit: () => void;
}

interface UseLastSavedSearchReturn {
  // If the `reloadLastSearch` url param is present.
  loadLastUsed: boolean;
}

export function useLastSavedSearch({
  indexName,
  setQueryBuilderTree,
  setSubmittedQueryBuilderTree,
  setPageOffset,
  performSubmit
}: UseLastSavedSearchProps): UseLastSavedSearchReturn {
  const localStorageLastUsedTreeKey = indexName + "-last-used-tree";

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
      setPageOffset(0);
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
      setPageOffset(0);
    } else {
      performSubmit();
    }
  }, [queryLoaded]);

  return {
    loadLastUsed: !!localStorageQueryTree
  };
}
