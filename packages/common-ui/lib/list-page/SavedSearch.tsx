import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useFormikContext } from "formik";
import { useAccount } from "../account/AccountProvider";
import { useModal } from "../modal/modal";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { AreYouSureModal } from "../modal/AreYouSureModal";
import { FilterParam } from "kitsu";
import { Dropdown, Modal, Button, Card, Badge } from "react-bootstrap";
import { FaRegFrown } from "react-icons/fa";

export interface SavedSearchProps {
  /**
   * Index name passed from the QueryPage component. Since it doesn't make sense to display saved
   * searches for all list pages, the index name is used to determine which saved searches should be
   * displayed and where news one's are created.
   */
  indexName: string;
}

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labeledBy?: string;
};

export function SavedSearch({ indexName }: SavedSearchProps) {
  const { formatMessage } = useDinaIntl();
  const { save, apiClient } = useApiClient();
  const { openModal } = useModal();
  const { subject } = useAccount();
  const { openSavedSearchModal } = useSavedSearchModal();
  const formik = useFormikContext();

  // Users saved preferences.
  const [userPreferences, setUserPreferences] = useState<UserPreference>();

  // When the user uses the "load" button, the selected saved search is saved here.
  const [loadedSavedSearch, setLoadedSavedSearch] = useState<string>();

  // When mounted, load in the user preferences.
  useEffect(() => {
    retrieveUserPreferences((loadedUserPreferences) => {
      if (loadedUserPreferences) {
        setUserPreferences(loadedUserPreferences);
      }
    });
  }, []);

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
        // setError(userPreferenceError);
        callback(undefined);
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
    (formik.values as any).queryRows?.map((val) => {
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

  const SavedSearchItem = (savedSearchName: string) => {
    return (
      <Card key={savedSearchName} className="mt-2">
        <Card.Body>
          <Card.Title>
            {savedSearchName}{" "}
            <Badge bg="primary" className="ms-2">
              Default
            </Badge>
          </Card.Title>
          <Card.Link href="#">Load</Card.Link>
          <Card.Link href="#">Set as default</Card.Link>
          <Card.Link href="#">Override</Card.Link>
          <Card.Link href="#">Delete</Card.Link>
        </Card.Body>
      </Card>
    );
  };

  // Take the saved search options and convert to an option list.
  // const DropdownOptions = Object.keys(
  //   userPreferences?.savedSearches?.[indexName] ?? {}
  // )
  //   .sort()
  //   .map((dropdownItem) => SavedSearchItem(dropdownItem));

  // Take the saved search options and convert to an option list.
  const DropdownOptions = [
    "Saved Search #1",
    "Saved Search #2",
    "Saved Search #3"
  ]
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
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="success"
              style={{ width: "100%" }}
              onClick={() => openSavedSearchModal({ saveSearch })}
            >
              Create new saved search
            </Button>
          </Modal.Footer>
        </div>
      );
    }
  );

  return (
    <Dropdown className="float-end">
      <Dropdown.Toggle>Saved Searches</Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
