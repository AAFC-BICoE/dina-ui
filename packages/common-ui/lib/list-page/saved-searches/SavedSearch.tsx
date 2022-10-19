import {
  DinaMessage,
  useDinaIntl
} from "../../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useState } from "react";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useAccount } from "../../account/AccountProvider";
import { useModal } from "../../modal/modal";
import { SaveArgs, useApiClient } from "../../api-client/ApiClientContext";
import { AreYouSureModal } from "../../modal/AreYouSureModal";
import { FilterParam } from "kitsu";
import { Dropdown, Modal, Button, Card, Badge } from "react-bootstrap";
import { FaRegFrown, FaTrash, FaCog, FaRegSadTear } from "react-icons/fa";
import { LoadingSpinner } from "../..";
import { ImmutableTree, Utils } from "react-awesome-query-builder";
import { SavedSearchStructure, SingleSavedSearch } from "./types";
import { mapKeys, values } from "lodash";

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
}

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labeledBy?: string;
};

export function SavedSearch({
  indexName,
  queryBuilderTree,
  setQueryBuilderTree
}: SavedSearchProps) {
  const { formatMessage } = useDinaIntl();
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

  // Using the user preferences get the options and user preferences.
  const userPreferenceID = userPreferences?.id;

  const { openSavedSearchModal, SavedSearchModal } = useSavedSearchModal({
    saveSearch,
    savedSearchNames:
      Object.keys(userPreferences?.savedSearches?.[indexName] ?? {}) ?? []
  });

  // Every time the last loaded is changed, retrieve the user preferences.
  useEffect(() => {
    retrieveUserPreferences();
  }, [lastLoaded]);

  // When a new saved search is selected.
  useEffect(() => {
    if (!selectedSavedSearch && !userPreferences) return;

    loadSavedSearch(selectedSavedSearch ?? "");
  }, [selectedSavedSearch]);

  // User Preferences has been loaded in:
  useEffect(() => {
    if (!userPreferences) return;

    // User preferences have been loaded in, we can now check for the default saved search if it
    // exists and pre-load it in.
    const defaultSavedSearch = getDefaultSavedSearch();
    if (defaultSavedSearch && defaultSavedSearch.savedSearchName) {
      loadSavedSearch(defaultSavedSearch.savedSearchName);
    }
  }, [userPreferences]);

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
    return values(
      mapKeys(userPreferences?.savedSearches?.[indexName], (value, key) => {
        value.savedSearchName = key;
        return value;
      })
    ).find((savedSearch) => savedSearch.default);
  }

  /**
   * Look through all of the users saved searches for the indexName and find a matching name.
   *
   * @param savedSearchName name to search the saved searches against.
   */
  function getSavedSearch(
    savedSearchName: string
  ): SingleSavedSearch | undefined {
    if (!userPreferences) return;

    // Look though the saved searches for the indexName to see if any match the saved search name.
    return values(
      mapKeys(userPreferences?.savedSearches?.[indexName], (value, key) => {
        value.savedSearchName = key;
        return value;
      })
    ).find((savedSearch) => (savedSearch.savedSearchName = savedSearchName));
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

    if (savedSearchToLoad && savedSearchToLoad.savedSearchName) {
      setSelectedSavedSearch(savedSearchName);
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
   * ! Please note that saving will OVERRIDE existing settings if named exactly the same currently !
   *
   * @param savedSearchName The saved search name.
   * @param setAsDefault If the new search should be saved as the default. This will unset any other
   * default saved searches.
   */
  async function saveSearch(savedSearchName: string, setAsDefault: boolean) {
    if (!queryBuilderTree) return;

    // Check if there already exists a saved search with that name.

    // Copy any existing settings, just add/alter the saved search name.
    const newSavedSearchOptions: SavedSearchStructure = {
      ...userPreferences?.savedSearches,
      [indexName]: {
        ...userPreferences?.savedSearches?.[indexName],
        [savedSearchName]: {
          default: setAsDefault,
          queryTree: Utils.getTree(queryBuilderTree)
        }
      }
    };

    // If default is being set, then we must check the other saved searches under this index and
    // set them as false.
    if (setAsDefault) {
      const currentDefault = getDefaultSavedSearch();
      if (currentDefault && currentDefault.savedSearchName)
        newSavedSearchOptions[indexName][currentDefault.savedSearchName] = {
          ...newSavedSearchOptions[indexName][currentDefault.savedSearchName],
          default: true
        };
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
    // loadSavedSearch(savedSearchName);
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

      // loadSavedSearch("default");
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

  // Wait until the user preferences have been loaded in.
  if (loading) {
    return <LoadingSpinner loading={loading} />;
  }

  const DefaultBadge = () => {
    return (
      <Badge bg="secondary" className="ms-2">
        Default
      </Badge>
    );
  };

  const SavedSearchItem = (savedSearchName: string) => {
    return (
      <Card key={savedSearchName} className="mt-2">
        <Card.Body onClick={() => setSelectedSavedSearch(savedSearchName)}>
          <Card.Title>
            {savedSearchName}
            {DefaultBadge()}
            <Button className="float-end" variant="light">
              <FaTrash />
            </Button>
          </Card.Title>
        </Card.Body>
      </Card>
    );
  };

  // Take the saved search options and convert to an option list.
  const DropdownOptions = Object.keys(
    userPreferences?.savedSearches?.[indexName] ?? {}
  )
    .sort()
    .map((dropdownItem) => SavedSearchItem(dropdownItem));

  const CustomMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "0px"
          }}
          className={props.className}
          aria-labelledby={props.labeledBy}
        >
          <Modal.Header className="float-left">
            <Modal.Title>Saved Searches</Modal.Title>
          </Modal.Header>

          <Modal.Body
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              background: "#f9f9f9"
            }}
          >
            {error ? (
              <div style={{ textAlign: "center" }}>
                <h2>
                  <FaRegSadTear />
                </h2>
                <p>Unable to retrieve saved searches, please try again later</p>
              </div>
            ) : (
              <>
                {DropdownOptions.length === 0 ? (
                  <div style={{ textAlign: "center" }}>
                    <h2>
                      <FaRegFrown />
                    </h2>
                    <p>No saved searches have been created yet</p>
                  </div>
                ) : (
                  DropdownOptions
                )}
              </>
            )}
          </Modal.Body>
        </div>
      );
    }
  );

  return (
    <>
      {SavedSearchModal}
      <Dropdown className="float-end" autoClose="outside">
        <Dropdown.Toggle variant="light" className="btn-empty">
          <FaCog />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item href="#" onClick={openSavedSearchModal}>
            Create new
          </Dropdown.Item>
          {selectedSavedSearch && (
            <>
              <Dropdown.Item href="#">Overwrite</Dropdown.Item>
              <Dropdown.Item href="#">Set as default</Dropdown.Item>
              <Dropdown.Item href="#">Delete</Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown className="float-end" autoClose="outside">
        <Dropdown.Toggle variant="light" className="btn-empty">
          {selectedSavedSearch ?? "Saved Searches"}
          {currentIsDefault && DefaultBadge()}
        </Dropdown.Toggle>
        <Dropdown.Menu as={CustomMenu} />
      </Dropdown>
    </>
  );
}
