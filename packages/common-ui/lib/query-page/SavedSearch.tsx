import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { useState } from "react";
import Select from "react-select";

export interface SavedSearchProps {
  loadSavedSearch: (savedSearchName) => void;
  saveSearch: (JsonObject) => void;
  deleteSavedSearch: (savedSearchName?: string) => void;
  onChange?: (e) => void;
}

export function SavedSearch(props: SavedSearchProps) {
  const { loadSavedSearch, saveSearch, deleteSavedSearch, onChange } = props;
  const { formatMessage } = useDinaIntl();
  const savedSearchNamesOptions = [{}];
  const [selectedSearch, setSelectedSearch] = useState("");

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
      <button className="btn btn-secondary" onClick={saveSearch}>
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
