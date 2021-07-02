import { PersistedResource } from "kitsu";
import Link from "next/link";
import Pagination from "rc-pagination";
import { useState } from "react";
import { FaMinusSquare, FaPlusSquare } from "react-icons/fa";
import {
  FilterGroupModel,
  MetaWithTotal,
  rsql,
  useQuery,
  withResponse
} from "../../../common-ui/lib";
import { FilterRowModel } from "../../../common-ui/lib/filter-builder/FilterRow";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";

export interface BrowseStorageTreeProps {
  parentId?: string;
  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => void;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
  disabled?: boolean;

  filter?: FilterRowModel | null;
  className?: string;
}

export function BrowseStorageTree(props: BrowseStorageTreeProps) {
  const { className } = props;
  const [searchText, setSearchText] = useState<string>("");

  const [filter, setFilter] = useState<FilterRowModel | null>();

  function doSearch() {
    setFilter({
      id: -321,
      type: "FILTER_ROW" as const,
      attribute: "name",
      predicate: "IS" as const,
      searchType: "PARTIAL_MATCH" as const,
      value: searchText
    });
  }

  function resetSearch() {
    setSearchText("");
    setFilter(null);
  }

  return (
    <div className={className}>
      <div className={`input-group mb-3`} style={{ width: "30rem" }}>
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
      <div className={`fw-bold mb-3`}>
        {filter ? (
          <DinaMessage id="showingFilteredStorageUnits" />
        ) : (
          <DinaMessage id="showingTopLevelStorageUnits" />
        )}
        {":"}
      </div>
      <StorageTreeList {...props} filter={filter} />
    </div>
  );
}

export function StorageTreeList({
  onSelect,
  parentId,
  excludeOptionId,
  disabled,
  filter
}: BrowseStorageTreeProps) {
  const limit = 100;
  const [pageNumber, setPageNumber] = useState(1);
  const offset = (pageNumber - 1) * limit;

  const storageUnitsQuery = useQuery<StorageUnit[], MetaWithTotal>({
    path: `collection-api/storage-unit`,
    page: { limit, offset },
    filter: {
      rsql: rsql({
        type: "FILTER_GROUP",
        id: -123,
        operator: "AND",
        children: [
          // For inner storage units:
          ...(parentId
            ? [
                {
                  id: -321,
                  type: "FILTER_ROW" as const,
                  attribute: "parentStorageUnit.uuid",
                  predicate: "IS" as const,
                  searchType: "EXACT_MATCH" as const,
                  value: parentId
                }
              ]
            : []),
          ...(filter ? [filter] : [])
        ]
      }),
      // For top-level storage units:
      ...(!filter && !parentId ? { parentStorageUnit: null } : {})
    }
  });

  return withResponse(
    storageUnitsQuery,
    ({ data: units, meta: { totalResourceCount } }) => (
      <div>
        {totalResourceCount === 0 ? (
          <DinaMessage id="noNestedStorageUnits" />
        ) : (
          <>
            {units.map((unit, index) => (
              <div
                className={index === units.length - 1 ? "" : "my-2"}
                key={unit.id}
              >
                <StorageUnitCollapser
                  storageUnit={unit}
                  onSelect={onSelect}
                  disabled={disabled || unit.id === excludeOptionId}
                  excludeOptionId={excludeOptionId}
                />
              </div>
            ))}
            <Pagination
              total={totalResourceCount}
              locale={{}}
              pageSize={limit}
              current={pageNumber}
              onChange={setPageNumber}
              hideOnSinglePage={true}
            />
          </>
        )}
      </div>
    )
  );
}

interface StorageUnitCollapserProps {
  storageUnit: PersistedResource<StorageUnit>;
  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => void;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
  disabled?: boolean;
}

function StorageUnitCollapser({
  storageUnit,
  onSelect,
  disabled,
  excludeOptionId
}: StorageUnitCollapserProps) {
  const [isOpen, setOpen] = useState(false);

  function toggle() {
    setOpen(current => !current);
  }

  const CollapserIcon = isOpen ? FaMinusSquare : FaPlusSquare;

  return (
    <div className={`d-flex flex-row gap-2 collapser-for-${storageUnit.id}`}>
      <CollapserIcon
        className="storage-collapser-icon align-top"
        size="2em"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      />
      <div className="flex-grow-1">
        <div className="d-flex flex-row align-items-center gap-2 mb-3">
          <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
            <a className="storage-unit-name" target="_blank">
              {storageUnit.name}
            </a>
          </Link>
          <button
            className="select-storage btn btn-primary btn-sm"
            type="button"
            onClick={() => onSelect?.(storageUnit)}
            disabled={disabled}
          >
            <DinaMessage id="select" />
          </button>
        </div>
        {isOpen && (
          <StorageTreeList
            parentId={storageUnit.id}
            onSelect={onSelect}
            excludeOptionId={excludeOptionId}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
