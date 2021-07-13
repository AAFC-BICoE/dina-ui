import { PersistedResource } from "kitsu";
import { withResponse } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useStorageUnit } from "../../pages/collection/storage-unit/edit";
import { StorageUnit } from "../../types/collection-api";
import { StorageUnitBreadCrumb } from "./StorageUnitBreadCrumb";

export interface AssignedStorageProps {
  readOnly?: boolean;
  value?: PersistedResource<StorageUnit>;
  onChange?: (newValue: PersistedResource<StorageUnit> | { id: null }) => void;
  noneMessage?: JSX.Element;
}

/** Displays the currently assigned Storage, and lets you unlink it. */
export function AssignedStorage({
  onChange,
  readOnly,
  value,
  noneMessage
}: AssignedStorageProps) {
  const storageQuery = useStorageUnit(value?.id);

  return value?.id ? (
    <div>
      {withResponse(storageQuery, ({ data: storageUnit }) => (
        <div>
          <div className="storage-path mb-3">
            <StorageUnitBreadCrumb storageUnit={storageUnit} />
          </div>
          {!readOnly && (
            <button
              type="button"
              className="remove-storage btn btn-danger"
              onClick={() => onChange?.({ id: null })}
            >
              <DinaMessage id="removeFromParentStorageUnit" />
            </button>
          )}
        </div>
      ))}
    </div>
  ) : (
    noneMessage ?? <DinaMessage id="none" />
  );
}
