import { FormikButton, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { Promisable } from "type-fest";
import { StorageUnitContents } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useStorageUnit } from "../../pages/collection/storage-unit/edit";
import { StorageUnit } from "../../types/collection-api";
import { StorageUnitBreadCrumb } from "./StorageUnitBreadCrumb";

export interface AssignedStorageProps {
  /** ID of the stored object. */
  contentId?: string;
  readOnly?: boolean;
  value?: PersistedResource<StorageUnit>;
  onChange?: (
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) => Promisable<void>;
  noneMessage?: JSX.Element;
}

/** Displays the currently assigned Storage, and lets you unlink it. */
export function AssignedStorage({
  contentId,
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
          <div className="list-inline mb-3">
            <div className="storage-path list-inline-item">
              <StorageUnitBreadCrumb storageUnit={storageUnit} />
            </div>
            {storageUnit.storageUnitType?.isInseperable && (
              <div className="list-inline-item">
                (<DinaMessage id="keepContentsTogether" />)
              </div>
            )}
          </div>
          {!readOnly && (
            <FormikButton
              className="remove-storage btn btn-danger mb-3"
              onClick={async () => await onChange?.({ id: null })}
            >
              <DinaMessage id="removeFromParentStorageUnit" />
            </FormikButton>
          )}
          <div>
            <label>
              <DinaMessage id="otherContents" />
            </label>
            <StorageUnitContents
              storageId={storageUnit.id}
              excludeContentId={contentId}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    noneMessage ?? <DinaMessage id="none" />
  );
}
