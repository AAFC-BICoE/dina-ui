import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { JsonValue } from "type-fest";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { SelectField, SelectOption } from "../formik-connected/SelectField";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { useFormikContext } from "formik";

export interface SavedSearchProps {
  loadSavedSearch: (
    savedSearchName: string,
    userPreferences: UserPreference[]
  ) => void;
  saveSearch: (
    isDefault: boolean,
    userPreferences: UserPreference[],
    searchName?: string
  ) => void;
  deleteSavedSearch: (
    savedSearchName: string,
    userPreferences: UserPreference[]
  ) => void;
  savedSearchNames?: string[];
  initialSavedSearches?: JsonValue;
  selectedSearch?: string;
  userPreferences: UserPreference[];
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    loadSavedSearch,
    deleteSavedSearch,
    saveSearch,
    savedSearchNames,
    initialSavedSearches,
    selectedSearch,
    userPreferences
  } = props;
  const { formatMessage } = useDinaIntl();
  const formik = useFormikContext<any>();

  const { openSavedSearchModal } = useSavedSearchModal();
  const savedSearchNamesOptions: SelectOption<any>[] = [];

  savedSearchNames?.map(name =>
    savedSearchNamesOptions.push({ label: name, value: name })
  );

  return (
    <div className="d-flex gap-2 align-items-center">
      <div style={{ width: "400px" }}>
        <SelectField
          name={"savedSearchSelect"}
          aria-label="Saved Search"
          className="saved-search"
          options={savedSearchNamesOptions}
          removeLabel={true}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary mb-3"
        onClick={() =>
          loadSavedSearch(formik.values.savedSearchSelect, userPreferences)
        }
        disabled={
          !initialSavedSearches || !Object.keys(initialSavedSearches).length
        }
      >
        {formatMessage("load")}
      </button>
      <button
        type="button"
        className="btn btn-secondary mb-3"
        onClick={() => openSavedSearchModal({ saveSearch, userPreferences })}
      >
        {formatMessage("save")}
      </button>
      <button
        className="btn btn-danger mb-3"
        type="button"
        onClick={() =>
          deleteSavedSearch(formik.values.savedSearchSelect, userPreferences)
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
