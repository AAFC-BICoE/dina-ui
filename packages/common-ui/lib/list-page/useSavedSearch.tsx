import { FilterParam } from "kitsu";
import { cloneDeep } from "lodash";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useState } from "react";
import { useRecoilState } from "recoil";
import { useApiClient, useAccount } from "..";
import { errorState, loadingState } from "./recoil_state";
import { SavedSearch } from "./SavedSearch";

export interface UseSavedSearchProps {
  indexName: string;
}

export function useSavedSearch({ indexName }: UseSavedSearchProps) {
  const { apiClient } = useApiClient();
  const { groupNames, subject } = useAccount();

  const [error, setError] = useRecoilState(errorState);
  const [loading, setLoading] = useRecoilState(loadingState);

  // Users saved preferences.
  const [userPreferences, setUserPreferences] = useState<UserPreference>();

  // When the user uses the "load" button, the selected saved search is saved here.
  const [loadedSavedSearch, setLoadedSavedSearch] = useState<string>();

  /**
   * Using the user preferences, load the saved search name into the search filters.
   *
   * @param savedSearchName The name of the saved search to load.
   * @param applyFilters boolean to indicate if it should just set the loadedSavedSearch without applying the filters.
   * @returns
   */
  function loadSavedSearch(savedSearchName: string) {
    if (!savedSearchName) return;

    // Reload the user preferences incase they have changed.
    retrieveUserPreferences((userPreference) => {
      setLoadedSavedSearch(savedSearchName);

      // User preference must be returned.
      if (!userPreference) return;

      // Ensure that the user preference exists, if not do not load anything.
      const loadedOption =
        userPreference?.savedSearches?.[indexName]?.[savedSearchName];
      if (loadedOption) {
        setLoading(true);
        // TODO - Load saved searches need to be fixed.
        // setPagination({
        //  ...pagination,
        //   offset: 0,
        // });
      }
    });
  }

  /**
   * Retrieve the user preference for the logged in user. This is used for the SavedSearch
   * functionality since the saved searches are stored in the user preferences.
   */
  async function retrieveUserPreferences(
    callback: (userPreference?: UserPreference) => void
  ) {
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
        callback(response?.data?.[0]);
      })
      .catch((userPreferenceError) => {
        setError(userPreferenceError);
        callback(undefined);
      });
  }

  const SavedSearchSection = (
    <div className="flex-grow-1">
      {/* Saved Searches */}
      <label className="group-field d-flex gap-2 align-items-center mb-2">
        <div className="field-label">
          <strong>Saved Searches</strong>
        </div>
        <div className="flex-grow-1">
          <SavedSearch
            indexName={indexName}
            userPreferences={cloneDeep(userPreferences)}
            loadedSavedSearch={loadedSavedSearch}
            loadSavedSearch={loadSavedSearch}
          />
        </div>
      </label>
    </div>
  );

  return {
    SavedSearchSection
  };
}
