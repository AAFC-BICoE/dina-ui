import {
  ResourceSelect,
  SimpleSearchFilterBuilder,
  useAccount
} from "common-ui";
import { FilterParam, PersistedResource } from "kitsu";
import { useEffect, useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnitType } from "../../types/collection-api";

export interface StorageFilterProps {
  /**
   * To prevent displaying itself in the search results, this UUID will be filtered from the
   * results.
   */
  currentStorageUnitUUID?: string;

  onChange: (newValue: FilterParam | null) => void;
}

export function StorageFilter({
  onChange,
  currentStorageUnitUUID
}: StorageFilterProps) {
  const [searchText, setSearchText] = useState<string>("");
  const [storageTypeFilter, setStorageTypeFilter] =
    useState<PersistedResource<StorageUnitType>>();
  const [createdByMeFilter, setCreatedByMeFilter] = useState(false);

  const [performSearch, setPerformSearch] = useState<boolean>(false);

  const { username, groupNames } = useAccount();

  // Do the search whenever the dropdown or checkbox value changes:
  useEffect(() => {
    if (performSearch === false) {
      return;
    }

    onChange(
      SimpleSearchFilterBuilder.create()
        .searchFilter("name", searchText)
        .when(!!currentStorageUnitUUID, (builder) =>
          builder.where("uuid", "NEQ", currentStorageUnitUUID)
        )
        .when(createdByMeFilter && !!username, (builder) =>
          builder.where("createdBy", "EQ", username)
        )
        .when(!!storageTypeFilter?.id, (builder) =>
          builder.where("storageUnitType.uuid", "EQ", storageTypeFilter?.id)
        )
        .whereIn("group", groupNames)
        .build()
    );

    setPerformSearch(false);
  }, [performSearch]);

  // When changing the createdByMeFilter and storageTypeFilter, automatically submit the form.
  useEffect(() => {
    setPerformSearch(true);
  }, [createdByMeFilter, storageTypeFilter]);

  function resetSearch() {
    setCreatedByMeFilter(false);
    setStorageTypeFilter(undefined);
    setSearchText("");

    setPerformSearch(true);
  }

  return (
    <div>
      <div className="mb-3">
        <strong>
          <DinaMessage id="filterRecordsTitle" />
        </strong>
      </div>
      <label className="mb-3">
        <div className="d-flex align-items-center gap-2">
          <input
            type="checkbox"
            onChange={(e) => setCreatedByMeFilter(e.target.checked)}
            checked={createdByMeFilter}
            style={{
              height: "20px",
              width: "20px"
            }}
          />
          <strong>
            <DinaMessage id="storagesCreatedByMe" />
          </strong>
        </div>
      </label>
      <div className="row mb-3">
        <div className="col-sm-6">
          <label className="w-100">
            <strong>
              <DinaMessage id="name" />
            </strong>
            <input
              className="storage-tree-search form-control"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              // Pressing enter should set the filter, not submit the form:
              onKeyDown={(e) => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  setPerformSearch(true);
                }
              }}
              autoComplete="none"
            />
          </label>
        </div>
        <div className="col-sm-6">
          <label className="w-100">
            <strong>
              <DinaMessage id="storageUnitType" />
            </strong>
            <div className="input-group col-sm-6">
              <ResourceSelect<StorageUnitType>
                model="collection-api/storage-unit-type"
                optionLabel={(it) => it.name}
                filter={(searchValue: string) =>
                  SimpleSearchFilterBuilder.create<StorageUnitType>()
                    .searchFilter("name", searchValue)
                    .build()
                }
                onChange={setStorageTypeFilter as any}
                value={storageTypeFilter}
                styles={{ container: () => ({ flex: "auto" }) }}
              />
              <button
                className="storage-tree-search btn btn-primary"
                type="button"
                onClick={() => {
                  setPerformSearch(true);
                }}
              >
                <DinaMessage id="search" />
              </button>
              <button
                className="storage-tree-search-reset btn btn-dark"
                type="button"
                onClick={resetSearch}
              >
                <DinaMessage id="resetButtonText" />
              </button>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
