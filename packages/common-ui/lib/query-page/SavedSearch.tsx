import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useRef, useState } from "react";
import Select from "react-select";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useFormikContext } from "formik";
import { useAccount } from "../account/AccountProvider";
import { useModal } from "../modal/modal";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { AreYouSureModal } from "../modal/AreYouSureModal";

export interface SavedSearchProps {
  /**
   * Index name passed from the QueryPage component. Since it doesn't make sense to display saved
   * searches for all list pages, the index name is used to determine which saved searches should be
   * displayed and where news one's are created.
   */
  indexName: string;

  /**
   * The user preferences for the selected user. This should only be re-loaded on saving and deleting.
   */
  userPreferences?: UserPreference;

  /**
   * Passes the currently loaded saved search option, when a new loaded saved search is selected, it's
   * set as the default selected saved search.
   */
  loadedSavedSearch?: string;

  /**
   * When the user clicks the "Load" button, the selected saved search becomes the loaded saved search.
   */
  setLoadedSavedSearch: (loadedSavedSearchName: string) => void;

  /**
   * When creating or deleting records, the saved search list must be refreshed with new data.
   */
  refreshSavedSearches: () => void;
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    indexName,
    userPreferences,
    setLoadedSavedSearch,
    loadedSavedSearch,
    refreshSavedSearches
  } = props;
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { openModal } = useModal();
  const { subject } = useAccount();
  const { openSavedSearchModal } = useSavedSearchModal();
  const formik = useFormikContext();

  // Reference to the select dropdown element.
  const selectRef = useRef(null);

  // Selected saved search for the saved search dropdown.
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>(
    loadedSavedSearch &&
      userPreferences?.savedSearches?.[indexName]?.[loadedSavedSearch]
      ? loadedSavedSearch
      : ""
  );

  // Using the user preferences get the options and user preferences.
  const userPreferenceID = userPreferences?.id;

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

    refreshSavedSearches();

    // The newly saved option, should be switched to the selected.
    setLoadedSavedSearch(savedSearchName);
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

      setLoadedSavedSearch("default");

      refreshSavedSearches();
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
            setSelectedSavedSearch(selectedOption?.value ?? "")
          }
          value={{ value: selectedSavedSearch, label: selectedSavedSearch }}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          if (selectRef && selectRef.current) {
            setLoadedSavedSearch(selectedSavedSearch ?? "");
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
