import { PersistedResource } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { FaMinusSquare, FaPlusSquare } from "react-icons/fa";
import { useQuery, withResponse } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";

export interface BrowseStorageTreeProps {
  parentId?: string;
  onSelect: (storageUnit: PersistedResource<StorageUnit>) => void;
}

export function BrowseStorageTree({
  onSelect,
  parentId
}: BrowseStorageTreeProps) {
  const storageUnitsQuery = useQuery<StorageUnit[]>({
    path: `collection-api/storage-unit`,
    page: { limit: 1000 }, // TODO make sure more can be shown
    filter: parentId
      ? // For inner storage units:
        { rsql: `parentStorageUnit.uuid==${parentId}` }
      : // For top-level storage units:
        { parentStorageUnit: null }
  });

  return withResponse(storageUnitsQuery, ({ data: units }) => (
    <div>
      {!units.length ? (
        <DinaMessage id="noNestedStorageUnits" />
      ) : (
        units.map((unit, index) => (
          <div
            className={index === units.length - 1 ? "" : "my-2"}
            key={unit.id}
          >
            <StorageUnitCollapser storageUnit={unit} onSelect={onSelect} />
          </div>
        ))
      )}
    </div>
  ));
}

interface StorageUnitCollapserProps {
  storageUnit: PersistedResource<StorageUnit>;
  onSelect: (storageUnit: PersistedResource<StorageUnit>) => void;
}

function StorageUnitCollapser({
  storageUnit,
  onSelect
}: StorageUnitCollapserProps) {
  const [isOpen, setOpen] = useState(false);

  function toggle() {
    setOpen(current => !current);
  }

  const CollapserIcon = isOpen ? FaMinusSquare : FaPlusSquare;

  return (
    <div className="d-flex flex-row gap-2">
      <CollapserIcon
        className="align-top"
        size="2em"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      />
      <div className="flex-grow-1">
        <div className="d-flex flex-row align-items-center gap-2 mb-3">
          <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
            <a target="_blank">{storageUnit.name}</a>
          </Link>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => onSelect(storageUnit)}
          >
            <DinaMessage id="select" />
          </button>
        </div>
        {isOpen && (
          <BrowseStorageTree parentId={storageUnit.id} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}
