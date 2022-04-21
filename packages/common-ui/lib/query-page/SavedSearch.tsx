import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { JsonValue } from "type-fest";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useFormikContext } from "formik";
import { useAccount } from "../account/AccountProvider";
import { useModal } from "../modal/modal";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { AreYouSureModal } from "../modal/AreYouSureModal";
import { toPairs } from "lodash";
import { FilterParam } from "kitsu";

export interface SavedSearchProps {
  /**
   * Event prop triggered when a new saved search is loaded.
   */
  onSavedSearchLoad: (savedSearchData) => void;

  /**
   * Index name passed from the QueryPage component. Since it doesn't make sense to display saved
   * searches for all list pages, the index name is used to determine which saved searches should be
   * displayed and where news one's are created.
   */
  indexName: string;
}

export function SavedSearch(props: SavedSearchProps) {
  const { onSavedSearchLoad, indexName } = props;
  const { apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { openModal } = useModal();
  const { subject, groupNames } = useAccount();
  const { openSavedSearchModal } = useSavedSearchModal();
  const formik = useFormikContext();

  // Saved search dropdown options
  const [savedSearchOptions, setSavedSearchOptions] =
    useState<Map<string, JsonValue>>();

  // Selected saved search for the saved search dropdown.
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>("");

  // When the user uses the "load" button, the selected saved search is saved here.
  const [loadedSavedSearch, setLoadedSavedSearch] = useState<string>("");

  // Query Page error message state
  const [error, setError] = useState<any>();

  // Reference to the select dropdown element.
  const selectRef = useRef(null);

  // Retrieve user preferences on first render effect.
  useEffect(() => {
    // Retrieve user preferences...
    apiClient
      .get<UserPreference[]>("user-api/user-preference", {
        filter: {
          userId: subject as FilterParam
        },
        page: { limit: 1000 }
      })
      .then(response => {
        // Display the users saved searches for this specific index.
        const options =
          response?.data?.[0]?.savedSearches?.[indexName as string] ?? null;
        setSavedSearchOptions(options);

        // If the user has a default search, use it.
        if (options?.default) {
          setSelectedSavedSearch("default");
          setLoadedSavedSearch("default");
        }
      })
      .catch(userPreferenceError => {
        setError(userPreferenceError);
      });
  }, [savedSearchOptions]);

  // When the loaded saved search has changed, we need to load the saved option.
  useEffect(() => {
    // Ensure the setting actually exists for the selected option.
    const savedSearchSettings = savedSearchOptions?.[loadedSavedSearch];
    if (!savedSearchSettings) return;

    // Drill up to the query page component to load the new saved search data.
    onSavedSearchLoad(savedSearchSettings);
  }, [loadedSavedSearch]);

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
      [indexName]: { ...savedSearchOptions, [savedSearchName]: formik.values }
    };

    // Perform saving request.
    const saveArgs: SaveArgs<UserPreference> = {
      resource: {
        id: savedSearchOptions?.[0]?.id,
        userId: subject,
        savedSearches: newSavedSearchOptions
      } as any,
      type: "user-preference"
    };
    await save([saveArgs], { apiBaseUrl: "/user-api" });

    // The newly saved option, should be switched to the selected.
    setSelectedSavedSearch(savedSearchName);
  }

  /**
   * Delete a saved search from the saved search name.
   */
  async function deleteSavedSearch(savedSearchName: string) {
    async function deleteSearch() {
      delete savedSearchOptions?.[`${savedSearchName}`];

      const saveArgs: SaveArgs<UserPreference> = {
        resource: {
          id: savedSearchOptions?.[0]?.id,
          userId: subject,
          savedSearches: savedSearchOptions?.[0]?.savedSearches
        } as any,
        type: "user-preference"
      };

      await save([saveArgs], { apiBaseUrl: "/user-api" });

      if (toPairs(savedSearchOptions)?.[0]?.[0]) {
        setSelectedSavedSearch(toPairs(savedSearchOptions)?.[0]?.[0]);
      } else {
        // Clear the saved search data
        onSavedSearchLoad({
          queryRows: [{ fieldName: "" }],
          group: groupNames?.[0] ?? ""
        });
      }
    }

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

  return (
    <div className="d-flex gap-2">
      <div style={{ width: "400px" }}>
        <Select
          ref={selectRef}
          aria-label="Saved Search"
          className="saved-search"
          options={Array.from(savedSearchOptions ?? [], ([key, _]) => {
            return {
              value: key,
              label: key
            };
          })}
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
            setLoadedSavedSearch(selectedSavedSearch);
          }
        }}
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
        onClick={() => deleteSavedSearch(selectedSavedSearch)}
      >
        {formatMessage("deleteButtonText")}
      </button>
    </div>
  );
}
