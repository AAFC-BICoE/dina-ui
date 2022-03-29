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
import { useEffect } from "react";

export interface SavedSearchProps {
  onSavedSearchLoad: (savedSearchName) => void;
  selectedSearch?: string;
  userPreferences: UserPreference[];
}

export function SavedSearch(props: SavedSearchProps) {
  const { selectedSearch, userPreferences, onSavedSearchLoad } = props;
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { openModal } = useModal();
  const { username, subject } = useAccount();
  const { openSavedSearchModal } = useSavedSearchModal();
  const [curSelected, setCurSelected] = useState(null);
  const [savedSearchOptions, setSavedSearchOptions] = useState<
    SelectOption<string>[]
  >([]);
  const formik = useFormikContext();

  // When the user preferences update, the options should be saved.
  useEffect(() => {
    // if (userPreferences.length !== 0) {
    //   let selectOptions : SelectOption<string>[] = [];
    //   const options = (userPreferences[0].savedSearches?.[username as string] as Map<string, JsonValue>).forEach(option => {
    //     selectOptions.push({label: String(option), value: String(option)});
    //   })
    //   console.log(selectOptions)
    // }
  }, [userPreferences]);

  function onSelectedSavedSearchChanged(e) {
    setCurSelected(e.value);
  }

  function loadSavedSearch(savedSearchName) {
    if (!userPreferences || !savedSearchName) return;

    // Drill up to the query page component to load the new saved search data.
    onSavedSearchLoad(savedSearchName);
  }

  async function saveSearch(isDefault, searchName) {
    let newSavedSearches;
    const mySavedSearches = userPreferences;

    if (
      mySavedSearches &&
      mySavedSearches?.[0]?.savedSearches &&
      Object.keys(mySavedSearches?.[0]?.savedSearches)?.length > 0
    ) {
      // Remove irrelevant formik field array properties before save
      (formik.values as any).queryRows?.map(val => {
        delete val.props;
        delete val.key;
        delete val._store;
        delete val._owner;
        delete val.ref;
      });

      mySavedSearches[0].savedSearches[username as any][
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
        id: userPreferences?.[0]?.id,
        userId: subject,
        savedSearches:
          mySavedSearches?.[0]?.savedSearches ??
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
        userPreferences[0]?.savedSearches?.[username as any];
      delete userSavedSearches?.[`${savedSearchName}`];

      const saveArgs: SaveArgs<UserPreference> = {
        resource: {
          id: userPreferences?.[0]?.id,
          userId: subject,
          savedSearches: userPreferences?.[0]?.savedSearches
        } as any,
        type: "user-preference"
      };

      await save([saveArgs], { apiBaseUrl: "/user-api" });

      if (toPairs(userSavedSearches)?.[0]?.[0]) {
        loadSavedSearch(toPairs(userSavedSearches)?.[0]?.[0]);
      } else {
        // Clear the saved search data
        onSavedSearchLoad("");
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
    ? savedSearchOptions?.find(
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
          options={savedSearchOptions}
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
        // disabled={
        //   !initialSavedSearches || !Object.keys(initialSavedSearches).length
        // }
      >
        {formatMessage("load")}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => openSavedSearchModal({ saveSearch, userPreferences })}
      >
        {formatMessage("save")}
      </button>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() =>
          deleteSavedSearch((curSelected as any) ?? selectedSearch)
        }
        // disabled={
        //   !initialSavedSearches || !Object.keys(initialSavedSearches).length
        // }
      >
        {formatMessage("deleteButtonText")}
      </button>
    </div>
  );
}
