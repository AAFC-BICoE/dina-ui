import { useLocalStorage } from "@rehooks/local-storage";
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
}

interface UseLastSavedSearchReturn {
  // If the `reloadLastSearch` url param is present.
  loadLastUsed: boolean;
}

export function useLastSavedSearch({
  indexName,
  queryBuilderTree,
  setQueryBuilderTree,
  performSubmit
}: UseLastSavedSearchProps): UseLastSavedSearchReturn {
  const router = useRouter();
  const loadLastUsed = router?.query?.reloadLastSearch !== undefined;
  const localStorageKey = indexName + "-last-used-tree";

  const [queryLoaded, setQueryLoaded] = useState<boolean>(false);

  const [localStorageQueryTree, setLocalStorageQueryTree] =
    useLocalStorage<JsonTree>(localStorageKey);

  // Load in the last used save search if the reloadLastSearch param is present.
  useEffect(() => {
    if (loadLastUsed && localStorageQueryTree) {
      setQueryBuilderTree(Utils.loadTree(localStorageQueryTree as JsonTree));
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

  // Every time the tree has been changed, save it to local storage.
  useEffect(() => {
    if (!queryBuilderTree || !indexName || !queryLoaded) return;

    setLocalStorageQueryTree(Utils.getTree(queryBuilderTree));
  }, [queryBuilderTree]);

  return {
    loadLastUsed
  };
}
