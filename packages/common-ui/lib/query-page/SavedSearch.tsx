import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useState } from "react";
import Select from "react-select";
import { JsonValue } from "type-fest";
import { useSavedSearchModal } from "./useSavedSearchModal";

export interface SavedSearchProps {
  loadSavedSearch: (savedSearchName) => void;
  saveSearch: (
    value: JsonValue,
    isDefault: boolean,
    searchName: string
  ) => void;
  deleteSavedSearch: (savedSearchName?: string) => void;
  onChange?: (e) => void;
  value: JsonValue;
  savedSearchNames?: string[];
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    loadSavedSearch,
    deleteSavedSearch,
    onChange,
    value,
    saveSearch,
    savedSearchNames
  } = props;
  const { formatMessage } = useDinaIntl();
  const savedSearchNamesOptions: {}[] = [{}];

  savedSearchNames?.map(name =>
    savedSearchNamesOptions.push({ label: name, value: name })
  );

  const [selectedSearch, setSelectedSearch] = useState("");

  const { openSavedSearchModal } = useSavedSearchModal();

  function onSelectedSavedSearchChanged(e) {
    setSelectedSearch(e.value);
    onChange?.(e.value);
  }

  return (
    <div className="d-flex gap-2">
      <Select
        aria-label="Saved Search"
        className="saved-search"
        options={savedSearchNamesOptions}
        onChange={onSelectedSavedSearchChanged}
      />
      <button
        className="btn btn-primary"
        onClick={() => loadSavedSearch(selectedSearch)}
      >
        {formatMessage("load")}
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => openSavedSearchModal({ value, saveSearch })}
      >
        {formatMessage("save")}
      </button>
      <button
        className="btn btn-danger"
        onClick={() => deleteSavedSearch(selectedSearch)}
      >
        {formatMessage("deleteButtonText")}
      </button>
    </div>
  );
}
