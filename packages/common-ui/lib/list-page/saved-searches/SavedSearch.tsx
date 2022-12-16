import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "../../../../dina-ui/types/user-api";
import { useAccount } from "../../account/AccountProvider";
import { useModal } from "../../modal/modal";
import { SaveArgs, useApiClient } from "../../api-client/ApiClientContext";
import { AreYouSureModal } from "../../modal/AreYouSureModal";
import { FilterParam } from "kitsu";
import { Dropdown } from "react-bootstrap";
import { FaCog } from "react-icons/fa";
import { LoadingSpinner } from "../..";
import { Config, ImmutableTree, Utils } from "react-awesome-query-builder";
import { SavedSearchStructure, SingleSavedSearch } from "./types";
import { map, cloneDeep } from "lodash";
import { SavedSearchListDropdown } from "./SavedSearchListDropdown";
import { NotSavedBadge } from "./SavedSearchBadges";
import { useLastSavedSearch } from "../reload-last-search/useLastSavedSearch";

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
   * For the last loaded search, we will actually perform the search by calling this callback
   * function.
   */
  performSubmit: () => void;
}

/**
 * This component contains the following logic:
 *
 * - Load the last used query when the `?reloadLastQuery` param is present in the URL.
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
  performSubmit
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

  const [lastLoaded, setLastLoaded] = useState<number>(Date.now());

  const [lastSelected, setLastSelected] = useState<number>(Date.now());

  const [defaultLoadedIn, setDefaultLoadedIn] = useState<boolean>(false);

  const [changesMade, setChangesMade] = useState<boolean>(false);

  // Functionality for the last loaded search.
  const { loadLastUsed } = useLastSavedSearch({
    indexName,
    queryBuilderTree,
    setQueryBuilderTree,
    performSubmit
  });

  // Using the user preferences get the options and user preferences.
  const userPreferenceID = userPreferences?.id;

  // List of all the saved searches for this index.
  const dropdownOptions: SingleSavedSearch[] = useMemo(() => {
    if (!userPreferences) return [];

    return map(userPreferences?.savedSearches?.[indexName], (value, key) => {
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

  // Every time the last loaded is changed, retrieve the user preferences.
  useEffect(() => {
    retrieveUserPreferences();
  }, [lastLoaded]);

  // When a new saved search is selected.
  useEffect(() => {
    if (!selectedSavedSearch || !userPreferences) return;

    loadSavedSearch(selectedSavedSearch);
  }, [selectedSavedSearch, lastSelected]);

  // User Preferences has been loaded in and apply default loaded search:
  useEffect(() => {
    // Do not load the saved search if the last search used was loaded in.
    if (!userPreferences || defaultLoadedIn || loadLastUsed) return;

    // User preferences have been loaded in, we can now check for the default saved search if it
    // exists and pre-load it in.
    const defaultSavedSearch = getDefaultSavedSearch();
    if (defaultSavedSearch && defaultSavedSearch.savedSearchName) {
      loadSavedSearch(defaultSavedSearch.savedSearchName);
    }
    setDefaultLoadedIn(true);
  }, [userPreferences]);

  // Detect if any changes have been made to the query tree.
  useEffect(() => {
    if (!userPreferences || !selectedSavedSearch || !queryBuilderTree) return;

    const currentQueryTreeString = Utils.queryString(
      queryBuilderTree,
      queryBuilderConfig
    );

    // Compare against currently selected tree.
    if (compareChangeSelected === currentQueryTreeString) {
      setChangesMade(false);
    } else {
      setChangesMade(true);
    }
  }, [queryBuilderTree]);

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
    return cloneDeep(dropdownOptions).find(
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
    return cloneDeep(dropdownOptions).find(
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
      setSelectedSavedSearch(savedSearchToLoad.savedSearchName);
      setCurrentIsDefault(savedSearchToLoad.default);
      setQueryBuilderTree(Utils.loadTree(savedSearchToLoad.queryTree));
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
            default: setAsDefault,

            // If updateQueryTree is true, then we will retrieve the current query tree from the
            // query builder, otherwise it will remain the same as before.
            queryTree: updateQueryTree
              ? Utils.getTree(queryBuilderTree)
              : userPreferences?.savedSearches?.[indexName]?.[savedSearchName]
                  ?.queryTree ?? undefined
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
      await save([saveArgs], { apiBaseUrl: "/user-api" });

      // Trigger a reload of the user preferences.
      setLastLoaded(Date.now());

      // The newly saved option, should be switched to the selected.
      setSelectedSavedSearch(savedSearchName);
      setCurrentIsDefault(setAsDefault);
      setChangesMade(false);
    },
    [userPreferences, queryBuilderTree]
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
        await save([saveArgs], { apiBaseUrl: "/user-api" });

        // Unselect the saved search.
        setSelectedSavedSearch(undefined);
        setCurrentIsDefault(false);

        // Reload the user preference list.
        setLastLoaded(Date.now());
      }

      // Ask the user if they sure they want to delete the saved search.
      openModal(
        <AreYouSureModal
          actionMessage={
            <>
              <DinaMessage id="removeSavedSearch" />{" "}
              {`${savedSearchName ?? ""}`}{" "}
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
        cloneDeep(userPreferences)?.savedSearches?.[indexName] ?? {}
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
        selectedSavedSearch={selectedSavedSearch}
        currentIsDefault={currentIsDefault}
        error={error}
        onSavedSearchSelected={(savedSearchName) => {
          setLastSelected(Date.now());
          setSelectedSavedSearch(savedSearchName);
        }}
        onSavedSearchDelete={deleteSavedSearch}
      />
    </>
  );
}
