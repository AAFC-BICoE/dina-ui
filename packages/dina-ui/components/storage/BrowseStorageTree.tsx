import { PersistedResource } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { FaMinusSquare, FaPlusSquare } from "react-icons/fa";
import { MetaWithTotal, useQuery, withResponse } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import Pagination from "rc-pagination";

export interface BrowseStorageTreeProps {
  parentId?: string;
  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => void;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
  disabled?: boolean;
}

export function BrowseStorageTree({
  onSelect,
  parentId,
  excludeOptionId,
  disabled
}: BrowseStorageTreeProps) {
  const limit = 100;
  const [pageNumber, setPageNumber] = useState(1);
  const offset = (pageNumber - 1) * limit;

  const storageUnitsQuery = useQuery<StorageUnit[], MetaWithTotal>({
    path: `collection-api/storage-unit`,
    page: { limit, offset },
    filter: parentId
      ? // For inner storage units:
        { rsql: `parentStorageUnit.uuid==${parentId}` }
      : // For top-level storage units:
        { parentStorageUnit: null }
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
          <BrowseStorageTree
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
