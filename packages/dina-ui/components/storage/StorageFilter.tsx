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
  onChange: (newValue: FilterGroupModel | null) => void;
}

export function StorageFilter({ onChange }: StorageFilterProps) {
  const [searchText, setSearchText] = useState<string>("");
  const [storageTypeFilter, setStorageTypeFilter] =
    useState<PersistedResource<StorageUnitType>>();
  const [createdByMeFilter, setCreatedByMeFilter] = useState(false);
  const { username, groupNames } = useAccount();

  function doSearch() {
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
          ? groupNames.map((group, index) => {
              return {
                id: -index,
                type: "FILTER_ROW" as const,
                attribute: "group",
                predicate: "IS" as const,
                searchType: "EXACT_MATCH" as const,
                value: group
              };
            })
          : [])
      ]
    });
  }

  // Do the search whenever the dropdown or checkbox value changes:
  useEffect(doSearch, [createdByMeFilter, storageTypeFilter]);

  function resetSearch() {
    setCreatedByMeFilter(false);
    setStorageTypeFilter(undefined);
    setSearchText("");
    onChange(null);
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
                  doSearch();
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
                onClick={doSearch}
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
