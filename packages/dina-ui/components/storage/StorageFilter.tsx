import { useEffect, useState } from "react";
import { FilterGroupModel, useAccount } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface StorageFilterProps {
  onChange: (newValue: FilterGroupModel | null) => void;
}

export function StorageFilter({ onChange }: StorageFilterProps) {
  const [searchText, setSearchText] = useState<string>("");
  const [createdByMeFilter, setCreatedByMeFilter] = useState(false);
  const { username } = useAccount();

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
          : [])
      ]
    });
  }

  useEffect(doSearch, [createdByMeFilter]);

  function resetSearch() {
    setSearchText("");
    onChange(null);
  }

  return (
    <div className="d-flex flex-wrap align-items-center gap-5 mb-3">
      <label className="d-flex align-items-center gap-2">
        <input
          type="checkbox"
          onChange={e => setCreatedByMeFilter(e.target.checked)}
          checked={createdByMeFilter}
          style={{
            height: "20px",
            width: "20px"
          }}
        />
        <strong>
          <DinaMessage id="storagesCreatedByMe" />
        </strong>
      </label>
      <div className="input-group" style={{ width: "30rem" }}>
        <input
          className="storage-tree-search form-control"
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          // Pressing enter should set the filter, not submit the form:
          onKeyDown={e => {
            if (e.keyCode === 13) {
              e.preventDefault();
              doSearch();
            }
          }}
        />
        <button
          className="storage-tree-search btn btn-primary"
          type="button"
          style={{ width: "10rem" }}
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
    </div>
  );
}
