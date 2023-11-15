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
   * Query Builder local tree, used for changing the last used search into local storage.
   */
  queryBuilderTree?: ImmutableTree;

  /**
   * Set the query builder tree, used to to load a saved search.
   */
  setQueryBuilderTree: (newTree: ImmutableTree) => void;

  /**
   * For the last loaded search, we will actually perform the search by calling this callback
   * function.
   */
  performSubmit: () => void;

  onSortChange: (newSort: ColumnSort[]) => void;
}

interface UseLastSavedSearchReturn {
  // If the `reloadLastSearch` url param is present.
  loadLastUsed: boolean;
}

export function useLastSavedSearch({
  indexName,
  queryBuilderTree,
  setQueryBuilderTree,
  performSubmit,
  onSortChange
}: UseLastSavedSearchProps): UseLastSavedSearchReturn {
  const localStorageLastUsedTreeKey = indexName + "-last-used-tree";
  const localStorageLastUsedSortKey = indexName + "-last-used-sort";

  const [queryLoaded, setQueryLoaded] = useState<boolean>(false);

  const [localStorageQueryTree, setLocalStorageQueryTree] =
    useLocalStorage<JsonTree>(localStorageLastUsedTreeKey);
  const [localStorageSort, setLocalStorageSort] = useLocalStorage<ColumnSort[]>(
    localStorageLastUsedSortKey,
    []
  );

  // Load in the last used save search
  useEffect(() => {
    if (localStorageQueryTree) {
      setQueryBuilderTree(Utils.loadTree(localStorageQueryTree as JsonTree));
      onSortChange(localStorageSort);
      setQueryLoaded(true);
      performSubmit();
    } else {
      // Nothing to load in, mark as loaded.
      setQueryLoaded(true);
    }
  }, []);

  // Once the query builder tree has been loaded in, perform a submit.
  useEffect(() => {
    performSubmit();
  }, [queryLoaded]);

  return {
    loadLastUsed: !!localStorageQueryTree
  };
}
