import { PersistedResource } from "kitsu";
import Link from "next/link";
import { Fragment } from "react";
import { useQuery, withResponse } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";

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
  const storageQuery = useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${value?.id}`,
      include: [
        // TODO find a better way to query this:
        // Include storage units 10 layers up.
        "parentStorageUnit",
        "parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit",
        "parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit.parentStorageUnit"
      ].join(",")
    },
    { disabled: !value?.id }
  );

  return value?.id ? (
    <div>
      {withResponse(storageQuery, ({ data: storageUnit }) => {
        // Loop through the Storage Units to get the full path:
        const storagePath: PersistedResource<StorageUnit>[] = [];
        for (
          let unit: PersistedResource<StorageUnit> | null | undefined =
            storageUnit;
          unit;
          unit = unit.parentStorageUnit
        ) {
          storagePath.unshift(unit);
        }

        return (
          <div>
            <div className="storage-path mb-3">
              {/* Show the path of links e.g. Container1 > Container2 > Container3 */}
              {storagePath.map((unit, index) => (
                <Fragment key={index}>
                  <Link href={`/collection/storage-unit/view?id=${unit.id}`}>
                    <a target="_blank">{unit.name}</a>
                  </Link>
                  {index !== storagePath.length - 1 && <span>{" > "}</span>}
                </Fragment>
              ))}
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
        );
      })}
    </div>
  ) : (
    noneMessage ?? <DinaMessage id="none" />
  );
}
