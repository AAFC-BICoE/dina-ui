import classNames from "classnames";
import {
  FilterGroupModel,
  FormikButton,
  MetaWithTotal,
  rsql,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import Pagination from "rc-pagination";
import { useState } from "react";
import { FaMinusSquare, FaPlusSquare } from "react-icons/fa";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageFilter } from "./StorageFilter";

export interface BrowseStorageTreeProps {
  parentId?: string;
  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => Promisable<void>;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
  disabled?: boolean;

  filter?: FilterGroupModel | null;
  className?: string;
}

/** Hierarchy of nodes UI to search for and find a Storage Unit. */
export function BrowseStorageTree(props: BrowseStorageTreeProps) {
  const { className } = props;
  const [filter, setFilter] = useState<FilterGroupModel | null>(null);

  return (
    <div className={className}>
      <StorageFilter onChange={setFilter} />
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
    include: "hierarchy,storageUnitChildren",
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
      ...(!filter?.children?.length && !parentId
        ? { parentStorageUnit: null }
        : {})
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

  const hasChildren = !!(storageUnit as any).relationships?.storageUnitChildren
    ?.data?.length;

  return (
    <div className={`d-flex flex-row gap-2 collapser-for-${storageUnit.id}`}>
      <CollapserIcon
        className={classNames("storage-collapser-icon align-top", {
          // Un-comment this when including storageUnitChildren is not affected by the top-level filter:
          // Hide the expander button when there are no children:
          // "visually-hidden": !hasChildren
        })}
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
          {!disabled && (
            <FormikButton
              className="select-storage btn btn-primary btn-sm"
              onClick={() => onSelect?.(storageUnit)}
            >
              <DinaMessage id="select" />
            </FormikButton>
          )}
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
