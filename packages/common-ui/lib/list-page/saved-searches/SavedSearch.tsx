import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "../../../../dina-ui/types/user-api";
import { useAccount } from "../../account/AccountProvider";
import { useModal } from "../../modal/modal";
import { SaveArgs, useApiClient } from "../../api-client/ApiClientContext";
import { AreYouSureModal } from "../../modal/AreYouSureModal";
import { FilterParam } from "kitsu";
import { Alert, Button, Dropdown, ListGroup } from "react-bootstrap";
import { FaCog } from "react-icons/fa";
import {
  LoadingSpinner,
  VISIBLE_INDEX_LOCAL_STORAGE_KEY,
  defaultJsonTree
} from "../..";
import {
  Config,
  ImmutableTree,
  Utils,
  JsonTree
} from "@react-awesome-query-builder/ui";
import {
  SavedSearchStructure,
  SingleSavedSearch,
  SAVED_SEARCH_VERSION
} from "./types";
import _ from "lodash";
import { SavedSearchListDropdown } from "./SavedSearchListDropdown";
import { NotSavedBadge } from "./SavedSearchBadges";
import { useLastSavedSearch } from "../reload-last-search/useLastSavedSearch";
import {
  validateQueryTree,
  validateSavedSearchVerison
} from "../query-builder/query-builder-validator/queryBuilderValidator";
import { useSessionStorage } from "usehooks-ts";
import { useLocalStorage } from "@rehooks/local-storage";
import CopyToClipboardButton from "../CopyToClipboardButton";

export interface SavedSearchProps {
  /**
   * Index name passed from the QueryPage component. Since it doesn't make sense to display saved
   * searches for all list pages, the index name is used to determine which saved searches should be
   * displayed and where news one's are created.
   */
  indexName: string;

  /**
   * Query Builder local tree, used for saving the saved search.
   */
  queryBuilderTree?: ImmutableTree;

  /**
   * Set the query builder tree, used to to load a saved search.
   */
  setQueryBuilderTree: (newTree: ImmutableTree) => void;

  /**
   * Query builder configuration.
   *
   */
  queryBuilderConfig: Config;

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
   * Set the page offset, used to to load a saved search.
   */
  setPageOffset: React.Dispatch<React.SetStateAction<number>>;

  /**
   * Current groups being applied to the search.
   */
  groups: string[];

  /**
   * Set the groups to be loaded, used for the saved search.
   */
  setGroups: React.Dispatch<React.SetStateAction<string[]>>;

  /**
   * Used for generating the local storage keys. Every instance of the QueryPage should have it's
   * own unique name.
   *
   * In special cases where you want the sorting, pagination, column selection and other features
   * to remain the same across tables, it can share the same name.
   */
  uniqueName: string;

  // Reference for triggering the search. This helps prevent more searches than necessary.
  triggerSearch: React.MutableRefObject<boolean>;

  // Callback function to handle copying URL with query filters to clipboard
  onCopyToClipboard?: () => Promise<void>;

  copiedToClipboard?: boolean;

  setCopiedToClipboard?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function createSessionStorageLastUsedTreeKey(uniqueName: string) {
  return `${uniqueName}-last-used-tree`;
}

export function createLastUsedSavedSearchChangedKey(uniqueName: string) {
  return `${uniqueName}-saved-search-changed`;
}

/**
 * This component contains the following logic:
 *
 * - Load the last used query when if present in local storage.
 * - Ability to create new saved searches
 * - Delete existing saved searches
 * - Toggle the isDefault
 * - Load in saved searches to the Query Builder
 * - List all of the saved searches for the index name (see SavedSearchListDropdown component)
 *
 * The Saved Search contains a couple of dropdown menus and modals to allow the user to manage their
 * saved searches.
 */
export function SavedSearch({
  indexName,
  queryBuilderTree,
  setQueryBuilderTree,
  queryBuilderConfig,
  setSubmittedQueryBuilderTree,
  setPageOffset,
  groups,
  setGroups,
  performSubmit,
  uniqueName,
  triggerSearch,
  onCopyToClipboard,
  copiedToClipboard,
  setCopiedToClipboard
}: SavedSearchProps) {
  const { save, apiClient } = useApiClient();
  const { openModal } = useModal();
  const { subject } = useAccount();

  // Users saved preferences.
  const [userPreferences, setUserPreferences] = useState<UserPreference>();

  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>();

  const [currentIsDefault, setCurrentIsDefault] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>();

  const [isOutOfDateQuery, setIsOutOfDateQuery] = useState<boolean>(false);

  const [lastLoaded, setLastLoaded] = useState<number>(Date.now());

  const [lastSelected, setLastSelected] = useState<number>(Date.now());

  const [defaultLoadedIn, setDefaultLoadedIn] = useState<boolean>(false);

  const [changesMade, setChangesMade] = useState<boolean>(false);

  const [selectedSavedSearchName] = useState<string>();

  // Local storage of the displayed columns that are saved.
  const [localStorageDisplayedColumns, setLocalStorageDisplayedColumns] =
    useLocalStorage<string[]>(
      `${uniqueName}_${VISIBLE_INDEX_LOCAL_STORAGE_KEY}`,
      []
    );

  // Functionality for the last loaded search.
  const { loadLastSavedSearch } = useLastSavedSearch({
    setQueryBuilderTree,
    setSubmittedQueryBuilderTree,
    performSubmit,
    uniqueName
  });

  // Using the user preferences get the options and user preferences.
  const userPreferenceID = userPreferences?.id;

  // List of all the saved searches for this index.
  const dropdownOptions: SingleSavedSearch[] = useMemo(() => {
    if (!userPreferences) return [];

    return _.map(userPreferences?.savedSearches?.[indexName], (value, key) => {
      return {
        ...value,
        savedSearchName: key
      };
    });
  }, [userPreferences]);

  // Once the selected save search is changed, we generate a string query representation of the
  // selected saved search query tree. We use this to compare it against the current tree.
  // The reason we are using a string query is because it does not contain ids and it's better for
  // performance.
  const compareChangeSelected: string | undefined = useMemo(() => {
    if (!selectedSavedSearch || !userPreferences) return undefined;

    const selectedQueryTree =
      userPreferences?.savedSearches?.[indexName]?.[selectedSavedSearch]
        ?.queryTree;

    if (selectedQueryTree) {
      return Utils.queryString(
        Utils.loadTree(selectedQueryTree),
        queryBuilderConfig
      );
    }

    return undefined;
  }, [selectedSavedSearch, userPreferences]);

  const [sessionStorageQueryTree, setSessionStorageQueryTree] =
    useSessionStorage<JsonTree>(
      createSessionStorageLastUsedTreeKey(uniqueName),
      defaultJsonTree
    );

  // Every time the last loaded is changed, retrieve the user preferences.
  useEffect(() => {
    retrieveUserPreferences();
  }, [lastLoaded]);

  // When a new saved search is selected.
  useEffect(() => {
    if (!selectedSavedSearch || !userPreferences) return;
    setIsOutOfDateQuery(false);
    loadSavedSearch(selectedSavedSearch);
    triggerSearch.current = true;
  }, [selectedSavedSearch, lastSelected]);

  // User Preferences has been loaded in and apply default loaded search:
  useEffect(() => {
    // Do not load the saved search if the last search used was loaded in or there were changes
    if (!userPreferences || defaultLoadedIn || changesMade) return;

    // User preferences have been loaded in, we can now check for the default saved search if it
    // exists and pre-load it in.
    const defaultSavedSearch = getDefaultSavedSearch();

    if (
      defaultSavedSearch &&
      defaultSavedSearch.savedSearchName &&
      defaultSavedSearch?.queryTree
    ) {
      const isQueryChanged = getDefaultSavedSearchChanged(defaultSavedSearch);
      if (isQueryChanged) {
        loadLastSavedSearch();
      } else {
        loadSavedSearch(defaultSavedSearch.savedSearchName);
      }
    } else {
      // Default search not loaded in, check if last saved search can be loaded in.
      loadLastSavedSearch();
    }

    setDefaultLoadedIn(true);
  }, [userPreferences]);

  // Detect if any changes have been made to the query tree.
  useEffect(() => {
    if (isOutOfDateQuery) {
      setChangesMade(false);
      return;
    }

    if (!userPreferences || !selectedSavedSearch || !queryBuilderTree) return;
    const savedSearch =
      userPreferences?.savedSearches?.[indexName]?.[selectedSavedSearch];
    let isQueryChanged = false;

    const currentQueryTreeString = Utils.queryString(
      queryBuilderTree,
      queryBuilderConfig
    );

    // Compare against currently selected tree.
    if (compareChangeSelected !== currentQueryTreeString) {
      isQueryChanged = true;
    }

    // Check if the group has changed.
    if (!_.isEqual(_.sortBy(groups), _.sortBy(savedSearch?.groups))) {
      isQueryChanged = true;
    }

    // Check if the columns displayed has changed.
    if (
      !_.isEqual(
        _.sortBy(savedSearch?.columnVisibility),
        _.sortBy(localStorageDisplayedColumns)
      )
    ) {
      isQueryChanged = true;
    }

    setChangesMade(isQueryChanged);
  }, [queryBuilderTree, groups, localStorageDisplayedColumns]);

  function getDefaultSavedSearchChanged(defaultSavedSearch: SingleSavedSearch) {
    let isQueryChanged = false;
    const sessionStorageImmutableTree = Utils.loadTree(
      sessionStorageQueryTree as JsonTree
    );
    const sessionStorageQueryTreeString = Utils.queryString(
      sessionStorageImmutableTree,
      queryBuilderConfig
    );
    const defaultSavedSearchImmutableTree = Utils.loadTree(
      defaultSavedSearch?.queryTree as JsonTree
    );
    const defaultSavedSearchQueryTreeString = Utils.queryString(
      defaultSavedSearchImmutableTree,
      queryBuilderConfig
    );
    const defaultJsonTreeString = Utils.queryString(
      Utils.loadTree(defaultJsonTree),
      queryBuilderConfig
    );

    // Compare defaultSavedSearch against localStorage
    if (
      defaultSavedSearchQueryTreeString !== sessionStorageQueryTreeString &&
      defaultJsonTreeString !== sessionStorageQueryTreeString
    ) {
      isQueryChanged = true;
    }

    // Check if the group has changed.
    if (!_.isEqual(_.sortBy(groups), _.sortBy(defaultSavedSearch?.groups))) {
      isQueryChanged = true;
    }
    return isQueryChanged;
  }

  /**
   * Retrieve the user preference for the logged in user. This is used for the SavedSearch
   * functionality since the saved searches are stored in the user preferences.
   */
  async function retrieveUserPreferences() {
    // Retrieve user preferences...
    await apiClient
      .get<UserPreference[]>("user-api/user-preference", {
        filter: {
          userId: subject as FilterParam
        }
      })
      .then((response) => {
        // Set the user preferences to be a state for the QueryPage.
        setUserPreferences(response?.data?.[0]);
        setLoading(false);
      })
      .catch((userPreferenceError) => {
        setError(userPreferenceError);
        setUserPreferences(undefined);
        setLoading(false);
      });
  }

  /**
   * Checks if the user has a default saved search, if one does exist, it will be returned
   */
  function getDefaultSavedSearch(): SingleSavedSearch | undefined {
    if (!userPreferences) return;

    // Look though the saved searches for the indexName to see if any are default.
    return _.cloneDeep(dropdownOptions).find(
      (savedSearch) => savedSearch.default
    );
  }

  /**
   * Look through all of the users saved searches for the indexName and find a matching name.
   *
   * @param savedSearchName name to search the saved searches against.
   */
  function getSavedSearch(
    savedSearchName: string
  ): SingleSavedSearch | undefined {
    if (!userPreferences || !savedSearchName) return;

    // Look though the saved searches for the indexName to see if any match the saved search name.
    return _.cloneDeep(dropdownOptions).find(
      (savedSearch) => savedSearch.savedSearchName === savedSearchName
    );
  }

  /**
   * Find the saved search in the user preference and loads in the QueryBuilder tree.
   *
   * For loading the default search, checkout the `loadDefaultSavedSearch()` instead.
   *
   * @param savedSearchName Name of the saved search to load into the query builder.
   */
  function loadSavedSearch(savedSearchName: string) {
    const savedSearchToLoad = getSavedSearch(savedSearchName);

    if (
      savedSearchToLoad &&
      savedSearchToLoad.savedSearchName &&
      savedSearchToLoad.queryTree
    ) {
      // Check if the query tree is valid against the current config.
      if (
        validateQueryTree(savedSearchToLoad.queryTree, queryBuilderConfig) &&
        validateSavedSearchVerison(savedSearchToLoad)
      ) {
        // Valid saved search, submit and load the search.
        setSubmittedQueryBuilderTree(
          Utils.loadTree(savedSearchToLoad.queryTree)
        );
        setPageOffset(0);
        setSessionStorageQueryTree(savedSearchToLoad.queryTree);
      } else {
        setIsOutOfDateQuery(true);
        setChangesMade(true);
      }

      // Load the displayed columns for this search.
      if (savedSearchToLoad.columnVisibility) {
        setLocalStorageDisplayedColumns(savedSearchToLoad.columnVisibility);
      }

      setQueryBuilderTree(Utils.loadTree(savedSearchToLoad.queryTree));
      setSelectedSavedSearch(savedSearchToLoad.savedSearchName);
      setCurrentIsDefault(savedSearchToLoad.default);
      setGroups(savedSearchToLoad.groups ?? []);
    }
  }

  /**
   * Add a new saved search to the user's preferences. Searches will be saved using the following
   * format:
   *
   * userPreferences.savedSearches.[INDEX_NAME].[SEARCH_NAME]
   *
   * If an index does not exist yet for a user's saved search, this method will create that level
   * as well.
   *
   * Saved Searches with the same name will overwrite existing saved searches. A warning will appear
   * to let the user know.
   *
   * @param savedSearchName The saved search name.
   * @param setAsDefault If the new search should be saved as the default. This will unset any other
   * default saved searches.
   * @param updateQueryTree This prop is useful for changing just the default value without touching
   * the query tree already saved to it.
   */
  const saveSavedSearch = useCallback(
    async (
      savedSearchName: string,
      setAsDefault: boolean,
      updateQueryTree: boolean
    ) => {
      if (!queryBuilderTree) return;

      // Copy any existing settings, just add/alter the saved search name.
      const newSavedSearchOptions: SavedSearchStructure = {
        ...userPreferences?.savedSearches,
        [indexName]: {
          ...userPreferences?.savedSearches?.[indexName],
          [savedSearchName]: {
            version: SAVED_SEARCH_VERSION,
            default: setAsDefault,

            // Save selected columns
            columnVisibility: localStorageDisplayedColumns,

            // If updateQueryTree is true, then we will retrieve the current query tree from the
            // query builder, otherwise it will remain the same as before.
            queryTree: updateQueryTree
              ? Utils.getTree(queryBuilderTree)
              : userPreferences?.savedSearches?.[indexName]?.[savedSearchName]
                  ?.queryTree ?? undefined,

            groups
          }
        }
      };

      // If default is being set, then we must check the other saved searches under this index and
      // set them as false.
      if (setAsDefault) {
        const currentDefault = getDefaultSavedSearch();
        if (
          currentDefault &&
          currentDefault.savedSearchName &&
          currentDefault.savedSearchName !== savedSearchName
        ) {
          newSavedSearchOptions[indexName][currentDefault.savedSearchName] = {
            ...newSavedSearchOptions[indexName][currentDefault.savedSearchName],
            default: false
          };
        }
      }

      // Perform saving request.
      const saveArgs: SaveArgs<UserPreference> = {
        resource: {
          id: userPreferenceID ?? null,
          userId: subject,
          savedSearches: newSavedSearchOptions
        } as any,
        type: "user-preference"
      };
      await save([saveArgs], {
        apiBaseUrl: "/user-api",
        skipOperationForSingleRequest: true
      });

      // Trigger a reload of the user preferences.
      setLastLoaded(Date.now());

      // The newly saved option, should be switched to the selected.
      setSelectedSavedSearch(savedSearchName);
      setCurrentIsDefault(setAsDefault);
      setChangesMade(false);
      setIsOutOfDateQuery(false);
    },
    [userPreferences, queryBuilderTree, groups, localStorageDisplayedColumns]
  );

  /**
   * Delete a saved search from the saved search name. A prompt will appear asking the user they
   * are sure they want to delete the record.
   *
   * Once a saved search is deleted, the selected saved search is cleared.
   *
   * @param savedSearchName The saved search name to delete from the the saved search options.
   */
  const deleteSavedSearch = useCallback(
    async (savedSearchName: string) => {
      async function deleteSearch() {
        // User preference ID needs to be set in order to delete the record.
        if (!userPreferenceID) return;

        // Delete the key from the search options.
        const newSavedSearchStructure =
          userPreferences?.savedSearches?.[indexName];
        delete newSavedSearchStructure?.[savedSearchName];

        const saveArgs: SaveArgs<UserPreference> = {
          resource: {
            id: userPreferenceID,
            userId: subject,
            savedSearches: userPreferences?.savedSearches
          } as any,
          type: "user-preference"
        };
        await save([saveArgs], {
          apiBaseUrl: "/user-api",
          skipOperationForSingleRequest: true
        });

        // Unselect the saved search.
        setSelectedSavedSearch(undefined);
        setCurrentIsDefault(false);

        // Reload the user preference list.
        setLastLoaded(Date.now());
      }

      // Ask the user if they sure they want to delete the saved search.
      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="removeSavedSearch" />}
          messageBody={
            <>
              <strong>
                <DinaMessage id="areYouSureRemoveSavedSearch" />
              </strong>
              <br />"{savedSearchName}"
            </>
          }
          onYesButtonClicked={deleteSearch}
        />
      );
    },
    [userPreferences]
  );

  // Setup the create new modal, it's hidden from the user until it's requested.
  const { openSavedSearchModal, SavedSearchModal } = useSavedSearchModal({
    saveSearch: (searchName, isDefault) =>
      saveSavedSearch(searchName, isDefault, true),
    savedSearchNames:
      Object.keys(
        _.cloneDeep(userPreferences)?.savedSearches?.[indexName] ?? {}
      ) ?? []
  });

  // Wait until the user preferences have been loaded in.
  if (loading) {
    return (
      <div className="float-end">
        <LoadingSpinner loading={loading} />
      </div>
    );
  }

  return (
    <>
      {SavedSearchModal}
      <Dropdown className="float-end" autoClose="outside">
        <Dropdown.Toggle variant="light" className="btn-empty">
          <FaCog />
          <NotSavedBadge displayBadge={changesMade} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={openSavedSearchModal}>
            <DinaMessage id="createNew" />
          </Dropdown.Item>
          <Dropdown.Item>
            <CopyToClipboardButton
              copiedToClipboard={copiedToClipboard}
              onCopyToClipboard={async () => {
                await onCopyToClipboard?.();
                setCopiedToClipboard?.(true);
              }}
            />
          </Dropdown.Item>
          {selectedSavedSearch && (
            <>
              {currentIsDefault ? (
                <>
                  <Dropdown.Item
                    onClick={() =>
                      saveSavedSearch(selectedSavedSearch, false, false)
                    }
                  >
                    <DinaMessage id="unsetAsDefault" />
                  </Dropdown.Item>
                </>
              ) : (
                <>
                  <Dropdown.Item
                    onClick={() =>
                      saveSavedSearch(selectedSavedSearch, true, false)
                    }
                  >
                    <DinaMessage id="setAsDefault" />
                  </Dropdown.Item>
                </>
              )}
              {changesMade && (
                <>
                  <Dropdown.Item
                    onClick={() =>
                      saveSavedSearch(
                        selectedSavedSearch,
                        currentIsDefault,
                        true
                      )
                    }
                  >
                    <DinaMessage id="saveChanges" />
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setLastSelected(Date.now())}>
                    <DinaMessage id="reloadSavedSearch" />
                  </Dropdown.Item>
                </>
              )}
              <Dropdown.Item
                onClick={() => deleteSavedSearch(selectedSavedSearch)}
              >
                <DinaMessage id="deleteButtonText" />
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
      <SavedSearchListDropdown
        dropdownOptions={dropdownOptions}
        selectedSavedSearch={selectedSavedSearchName ?? selectedSavedSearch}
        currentIsDefault={currentIsDefault}
        error={error}
        onSavedSearchSelected={(savedSearchName) => {
          setLastSelected(Date.now());
          setSelectedSavedSearch(savedSearchName);
        }}
        onSavedSearchDelete={deleteSavedSearch}
      />

      {/** Display out of date search query to the user with instructions on fixing it. */}
      {isOutOfDateQuery && selectedSavedSearch && (
        <Alert variant="warning">
          <Alert.Heading>
            <DinaMessage id="reviewSavedSearchHeading" />
          </Alert.Heading>
          <p>
            <DinaMessage
              id="reviewSavedSearchMessage"
              values={{ savedSearch: <strong>{selectedSavedSearch}</strong> }}
            />
          </p>
          <hr />
          <p className="mb-2">
            <strong>
              <DinaMessage id="reviewSavedSearchWhatToDo" />
            </strong>
          </p>
          <ListGroup variant="flush" as="ol" numbered>
            <ListGroup.Item
              as="li"
              className="border-0 bg-transparent px-0 py-1"
              style={{
                color: "#664d03"
              }}
            >
              <DinaMessage id="reviewSavedSearchCheck" />
            </ListGroup.Item>
            <ListGroup.Item
              as="li"
              className="border-0 bg-transparent px-0 py-1"
              style={{
                color: "#664d03"
              }}
            >
              <DinaMessage id="reviewSavedSearchConfirm" />
            </ListGroup.Item>
          </ListGroup>
          <p className="mt-3 mb-0">
            <DinaMessage id="reviewSavedSearchEnsure" />
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button
              variant="warning"
              onClick={() =>
                saveSavedSearch(selectedSavedSearch, currentIsDefault, true)
              }
            >
              <DinaMessage id="reviewSavedSearchConfirmButton" />
            </Button>
          </div>
        </Alert>
      )}
    </>
  );
}
