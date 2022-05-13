import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useRef } from "react";
import Select from "react-select";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useFormikContext } from "formik";
import { useAccount } from "../account/AccountProvider";
import { useModal } from "../modal/modal";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { AreYouSureModal } from "../modal/AreYouSureModal";
import { FilterParam } from "kitsu";
import { QueryPageActions, QueryPageStates } from "./QueryPage";

export interface SavedSearchProps {
  /**
   * Dispatch actions from the QueryPage.
   */
  dispatch: React.Dispatch<QueryPageActions>;

  /**
   * States from the query page reducer.
   */
  queryPageState: QueryPageStates;
}

export function SavedSearch(props: SavedSearchProps) {
  const { apiClient } = useApiClient();
  const { dispatch, queryPageState } = props;
  const {
    reloadUserPreferences,
    userPreferences,
    indexName,
    selectedSavedSearch
  } = queryPageState;
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { openModal } = useModal();
  const { subject } = useAccount();
  const { openSavedSearchModal } = useSavedSearchModal();
  const formik = useFormikContext();

  // Reference to the select dropdown element.
  const selectRef = useRef(null);

  // Using the user preferences get the options and user preferences.
  const userPreferenceID = userPreferences?.id;

  useEffect(() => {
    retrieveUserPreferences();
  }, [reloadUserPreferences]);

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
      .then(response => {
        // Set the user preferences to be a state for the QueryPage.
        dispatch({
          type: "USER_PREFERENCE_CHANGE",
          newUserPreferences: response?.data?.[0]
        });
      })
      .catch(() => {
        dispatch({
          type: "ERROR",
          errorLabel: "Failed to retrieve user preferences."
        });
      });
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
   * ! Please note that saving will OVERRIDE existing settings if named exactly the same currently !
   *
   * @param savedSearchName The saved search name. "default" is a special case, doesn't change how
   *    it's saved but will load that search automatically.
   */
  async function saveSearch(savedSearchName: string) {
    // Before saving, remove irrelevant formik field array properties.
    (formik.values as any).queryRows?.map(val => {
      delete val.props;
      delete val.key;
      delete val._store;
      delete val._owner;
      delete val.ref;
    });

    // Copy any existing settings, just add/alter the saved search name.
    const newSavedSearchOptions = {
      ...userPreferences?.savedSearches,
      [indexName]: {
        ...userPreferences?.savedSearches?.[indexName],
        [savedSearchName]: formik.values
      }
    };

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

    // The newly saved option, should be switched to the selected.
    dispatch({ type: "LOAD_SAVED_SEARCH" });
  }

  /**
   * Delete a saved search from the saved search name. A prompt will appear asking the user they
   * are sure they want to delete the record.
   *
   * Once a saved search is deleted, the user will go back to the default or the first option in the
   * list.
   *
   * @param savedSearchName The saved search name to delete from the the saved search options.
   */
  async function deleteSavedSearch(savedSearchName: string) {
    async function deleteSearch() {
      // User preference ID needs to be set in order to delete the record.
      if (!userPreferenceID) return;

      // Delete the key from the search options.
      delete userPreferences?.savedSearches?.[indexName]?.[savedSearchName];

      const saveArgs: SaveArgs<UserPreference> = {
        resource: {
          id: userPreferenceID,
          userId: subject,
          savedSearches: userPreferences?.savedSearches
        } as any,
        type: "user-preference"
      };
      await save([saveArgs], { apiBaseUrl: "/user-api" });
      // TO DO: Default is needed here.
      dispatch({ type: "LOAD_SAVED_SEARCH" });
    }

    // Ask the user if they sure they want to delete the saved search.
    openModal(
      <AreYouSureModal
        actionMessage={
          <>
            <DinaMessage id="removeSavedSearch" /> {`${savedSearchName ?? ""}`}{" "}
          </>
        }
        onYesButtonClicked={deleteSearch}
      />
    );
  }

  // Take the saved search options and convert to an option list.
  const dropdownOptions = Object.keys(
    userPreferences?.savedSearches?.[indexName] ?? {}
  )
    .sort()
    .map(key => ({
      value: key,
      label: key
    }));

  return (
    <div className="d-flex gap-2">
      <div style={{ width: "400px" }}>
        <Select
          ref={selectRef}
          aria-label="Saved Search"
          className="saved-search"
          options={dropdownOptions}
          onChange={selectedOption =>
            dispatch({
              type: "SAVED_SEARCH_CHANGE",
              newSavedSearch: selectedOption?.value ?? ""
            })
          }
          value={{ value: selectedSavedSearch, label: selectedSavedSearch }}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          if (selectRef && selectRef.current) {
            dispatch({ type: "LOAD_SAVED_SEARCH" });
          }
        }}
        disabled={selectedSavedSearch ? false : true}
      >
        {formatMessage("load")}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => openSavedSearchModal({ saveSearch })}
      >
        {formatMessage("save")}
      </button>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() => deleteSavedSearch(selectedSavedSearch ?? "")}
        disabled={selectedSavedSearch ? false : true}
      >
        {formatMessage("deleteButtonText")}
      </button>
    </div>
  );
}
