import { FormikButton, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useStorageUnit } from "../../pages/collection/storage-unit/edit";
import { StorageUnit } from "../../types/collection-api";
import { StorageUnitBreadCrumb } from "./StorageUnitBreadCrumb";
import { RiDeleteBinLine } from "react-icons/ri";

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
            {!readOnly && !parentIdInURL && (
              <FormikButton
                className="remove-storage btn mb-3"
                onClick={async () => await onChange?.({ id: null })}
              >
                <RiDeleteBinLine size="1.8em" />
              </FormikButton>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : (
    noneMessage ?? <DinaMessage id="none" />
  );
}
