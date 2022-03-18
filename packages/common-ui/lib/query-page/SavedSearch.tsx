import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useSavedSearchModal } from "./useSavedSearchModal";
import { SelectField, SelectOption } from "../formik-connected/SelectField";
import { UserPreference } from "packages/dina-ui/types/user-api";
import { FormikProps } from "formik";
import { useAccount } from "../account/AccountProvider";

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
  userPreferences: UserPreference[];
  pageRef: React.MutableRefObject<FormikProps<any>>;
}

export function SavedSearch(props: SavedSearchProps) {
  const {
    loadSavedSearch,
    deleteSavedSearch,
    saveSearch,
    userPreferences,
    pageRef
  } = props;
  const { formatMessage } = useDinaIntl();
  const { username } = useAccount();

  const { openSavedSearchModal } = useSavedSearchModal();
  const savedSearchNamesOptions: SelectOption<any>[] = [];

  const initialSavedSearches = userPreferences?.[0]?.savedSearches?.[
    username as any
  ] as any;

  const savedSearchNames = initialSavedSearches
    ? Object.keys(initialSavedSearches)
    : [];

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
          loadSavedSearch(
            pageRef.current.values.savedSearchSelect,
            userPreferences
          )
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
          deleteSavedSearch(
            pageRef.current.values.savedSearchSelect,
            userPreferences
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
