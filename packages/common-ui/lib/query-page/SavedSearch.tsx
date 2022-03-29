import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState } from "react";
import Select from "react-select";
import { JsonValue } from "type-fest";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { SelectOption } from "../formik-connected/SelectField";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useFormikContext } from "formik";
import { useAccount } from "../account/AccountProvider";
import { useModal } from "../modal/modal";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { AreYouSureModal } from "../modal/AreYouSureModal";
import { toPairs } from "lodash";

export interface SavedSearchProps {
  onSavedSearchLoad: (savedSearchName, savedSearchData) => void;
  savedSearchNames?: string[];
  initialSavedSearches?: JsonValue;
  selectedSearch?: string;
  userPreferences: UserPreference;
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    savedSearchNames,
    initialSavedSearches,
    selectedSearch,
    userPreferences,
    onSavedSearchLoad
  } = props;
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { openModal } = useModal();
  const { username, subject, groupNames } = useAccount();
  const { openSavedSearchModal } = useSavedSearchModal();
  const [curSelected, setCurSelected] = useState(null);
  const savedSearchNamesOptions: SelectOption<string>[] = [];
  const formik = useFormikContext();

  savedSearchNames?.map(name =>
    savedSearchNamesOptions.push({ label: name, value: name })
  );

  function onSelectedSavedSearchChanged(e) {
    setCurSelected(e.value);
  }

  function loadSavedSearch(savedSearchName) {
    if (!userPreferences || !savedSearchName) return;

    // Drill up to the query page component to load the new saved search data.
    onSavedSearchLoad(
      savedSearchName,
      userPreferences?.savedSearches?.[username as any]?.[savedSearchName]
    );
  }

  async function saveSearch(isDefault, searchName) {
    let newSavedSearches;
    const mySavedSearches = userPreferences;

    if (
      mySavedSearches &&
      mySavedSearches?.savedSearches &&
      Object.keys(mySavedSearches?.savedSearches)?.length > 0
    ) {
      // Remove irrelevant formik field array properties before save
      (formik.values as any).queryRows?.map(val => {
        delete val.props;
        delete val.key;
        delete val._store;
        delete val._owner;
        delete val.ref;
      });

      mySavedSearches.savedSearches[username as any][
        `${isDefault ? "default" : searchName}`
      ] = formik.values;
    } else {
      newSavedSearches = {
        [`${username}`]: {
          [`${isDefault ? "default" : searchName}`]: formik.values
        }
      };
    }
    const saveArgs: SaveArgs<UserPreference> = {
      resource: {
        id: userPreferences?.id,
        userId: subject,
        savedSearches:
          mySavedSearches?.savedSearches ??
          (newSavedSearches as Map<string, JsonValue>)
      } as any,
      type: "user-preference"
    };
    await save([saveArgs], { apiBaseUrl: "/user-api" });
    loadSavedSearch(isDefault ? "default" : searchName);
  }

  async function deleteSavedSearch(savedSearchName: string) {
    async function deleteSearch() {
      const userSavedSearches =
        userPreferences?.savedSearches?.[username as any];
      delete userSavedSearches?.[`${savedSearchName}`];

      const saveArgs: SaveArgs<UserPreference> = {
        resource: {
          id: userPreferences?.id,
          userId: subject,
          savedSearches: userPreferences?.savedSearches
        } as any,
        type: "user-preference"
      };

      await save([saveArgs], { apiBaseUrl: "/user-api" });

      if (toPairs(userSavedSearches)?.[0]) {
        loadSavedSearch(toPairs(userSavedSearches)?.[0]);
      } else {
        // Clear the saved search data
        onSavedSearchLoad("", {
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

  const computedSelected = curSelected ?? selectedSearch;
  const selectedOption = computedSelected
    ? savedSearchNamesOptions?.find(
        option => option?.value === computedSelected
      ) ?? {
        label: String(computedSelected),
        value: computedSelected
      }
    : null;

  return (
    <div className="d-flex gap-2">
      <div style={{ width: "400px" }}>
        <Select
          aria-label="Saved Search"
          className="saved-search"
          options={savedSearchNamesOptions}
          onChange={onSelectedSavedSearchChanged}
          value={selectedOption}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() =>
          loadSavedSearch(curSelected ?? (selectedSearch as string))
        }
        disabled={
          !initialSavedSearches || !Object.keys(initialSavedSearches).length
        }
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
        onClick={() =>
          deleteSavedSearch((curSelected as any) ?? selectedSearch)
        }
        disabled={
          !initialSavedSearches || !Object.keys(initialSavedSearches).length
        }
      >
        {formatMessage("deleteButtonText")}
      </button>
    </div>
  );
}
