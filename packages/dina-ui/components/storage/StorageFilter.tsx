import {
  filterBy,
  FilterGroupModel,
  ResourceSelect,
  useAccount
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect, useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnitType } from "../../types/collection-api";

export interface StorageFilterProps {
  /**
   * To prevent displaying itself in the search results, this UUID will be filtered from the
   * results.
   */
  currentStorageUnitUUID?: string;

  onChange: (newValue: FilterGroupModel | null) => void;
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

    onChange({
      type: "FILTER_GROUP",
      id: -123,
      operator: "AND",
      children: [
        ...(searchText
          ? [
              {
                id: -321,
                type: "FILTER_ROW" as const,
                attribute: "name",
                predicate: "IS" as const,
                searchType: "PARTIAL_MATCH" as const,
                value: searchText
              }
            ]
          : []),
        // Hide the parent storage unit, to prevent linking of itself.
        ...(currentStorageUnitUUID
          ? [
              {
                id: -432,
                type: "FILTER_ROW" as const,
                attribute: "uuid",
                predicate: "IS NOT" as const,
                searchType: "EXACT_MATCH" as const,
                value: currentStorageUnitUUID
              }
            ]
          : []),
        ...(createdByMeFilter && username
          ? [
              {
                id: -987,
                type: "FILTER_ROW" as const,
                attribute: "createdBy",
                predicate: "IS" as const,
                searchType: "EXACT_MATCH" as const,
                value: username
              }
            ]
          : []),
        ...(storageTypeFilter?.id
          ? [
              {
                id: -1234321,
                type: "FILTER_ROW" as const,
                attribute: "storageUnitType.uuid",
                predicate: "IS" as const,
                searchType: "EXACT_MATCH" as const,
                value: storageTypeFilter.id
              }
            ]
          : []),
        ...(groupNames
          ? [
              {
                id: -1234,
                type: "FILTER_ROW" as const,
                predicate: "IS" as const,
                searchType: "EXACT_MATCH" as const,
                value: groupNames.join(","),
                attribute: {
                  allowRange: false,
                  allowList: true,
                  name: "group"
                }
              }
            ]
          : [])
      ]
    });

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
                filter={filterBy(["name"])}
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
