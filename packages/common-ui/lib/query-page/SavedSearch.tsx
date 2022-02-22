import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useState } from "react";
import Select from "react-select";
import { JsonValue } from "type-fest";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { SelectOption } from "../formik-connected/SelectField";
import { UserPreference } from "packages/dina-ui/types/user-api";

export interface SavedSearchProps {
  loadSavedSearch: (
    savedSearchName: string,
    savedSearches: UserPreference[]
  ) => void;
  saveSearch: (
    isDefault: boolean,
    savedSearches: UserPreference[],
    searchName?: string
  ) => void;
  deleteSavedSearch: (
    savedSearchName: string,
    savedSearches: UserPreference[]
  ) => void;
  savedSearchNames?: string[];
  initialSavedSearches?: JsonValue;
  selectedSearch?: string;
  savedSearches: UserPreference[];
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    loadSavedSearch,
    deleteSavedSearch,
    saveSearch,
    savedSearchNames,
    initialSavedSearches,
    selectedSearch,
    savedSearches
  } = props;
  const { formatMessage } = useDinaIntl();
  const [curSelected, setCurSelected] = useState(null);

  const { openSavedSearchModal } = useSavedSearchModal();
  const savedSearchNamesOptions: SelectOption<string>[] = [];

  savedSearchNames?.map(name =>
    savedSearchNamesOptions.push({ label: name, value: name })
  );

  function onSelectedSavedSearchChanged(e) {
    setCurSelected(e.value);
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
      <Select
        aria-label="Saved Search"
        className="saved-search"
        options={savedSearchNamesOptions}
        onChange={onSelectedSavedSearchChanged}
        value={selectedOption}
      />
      <button
        className="btn btn-primary"
        onClick={() =>
          loadSavedSearch(
            curSelected ?? (selectedSearch as string),
            savedSearches
          )
        }
        disabled={
          !initialSavedSearches || !Object.keys(initialSavedSearches).length
        }
      >
        {formatMessage("load")}
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => openSavedSearchModal({ saveSearch, savedSearches })}
      >
        {formatMessage("save")}
      </button>
      <button
        className="btn btn-danger"
        onClick={() =>
          deleteSavedSearch(
            (curSelected as any) ?? selectedSearch,
            savedSearches
          )
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
