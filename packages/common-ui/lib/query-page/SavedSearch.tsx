import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useRef, useState } from "react";
import Select from "react-select";
import { JsonValue } from "type-fest";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { SelectOption } from "../formik-connected/SelectField";

export interface SavedSearchProps {
  loadSavedSearch: (savedSearchName) => void;
  saveSearch: (
    value: JsonValue,
    isDefault: boolean,
    searchName: string
  ) => void;
  deleteSavedSearch: (savedSearchName?: string) => void;
  value: JsonValue;
  savedSearchNames?: string[];
  initialSavedSearches?: JsonValue[];
  selectedSearch?: string;
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    loadSavedSearch,
    deleteSavedSearch,
    value,
    saveSearch,
    savedSearchNames,
    initialSavedSearches,
    selectedSearch
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
        onClick={() => loadSavedSearch(curSelected ?? selectedSearch)}
        disabled={!initialSavedSearches}
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
        onClick={() =>
          deleteSavedSearch((curSelected as any) ?? selectedSearch)
        }
        disabled={!initialSavedSearches}
      >
        {formatMessage("deleteButtonText")}
      </button>
    </div>
  );
}
