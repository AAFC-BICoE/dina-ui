import { FormikButton, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useStorageUnit } from "../../pages/collection/storage-unit/edit";
import { StorageUnit } from "../../types/collection-api";
import { StorageUnitBreadCrumb } from "./StorageUnitBreadCrumb";

export interface AssignedStorageProps {
  readOnly?: boolean;
  value?: PersistedResource<StorageUnit>;
  onChange?: (
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) => Promisable<void>;
  noneMessage?: JSX.Element;
  parentIdInURL?: string;
}

/** Displays the currently assigned Storage, and lets you unlink it. */
export function AssignedStorage({
  onChange,
  readOnly,
  value,
  noneMessage,
  parentIdInURL
}: AssignedStorageProps) {
  const storageQuery = useStorageUnit(value?.id);

  return value?.id ? (
    <div>
      {withResponse(storageQuery, ({ data: storageUnit }) => (
        <div>
          <div className="list-inline mb-3">
            <div className="storage-path list-inline-item">
              <StorageUnitBreadCrumb
                storageUnit={storageUnit}
                newTab={!readOnly}
              />
            </div>
            {storageUnit.storageUnitType?.isInseperable && (
              <div className="list-inline-item">
                (<DinaMessage id="keepContentsTogether" />)
              </div>
            )}
          </div>
          {!readOnly && !parentIdInURL && (
            <FormikButton
              className="remove-storage btn btn-danger mb-3"
              onClick={async () => await onChange?.({ id: null })}
            >
              <DinaMessage id="removeFromParentStorageUnit" />
            </FormikButton>
          )}
        </div>
      ))}
    </div>
  ) : (
    noneMessage ?? <DinaMessage id="none" />
  );
}
