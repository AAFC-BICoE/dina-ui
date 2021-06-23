import { PersistedResource } from "kitsu";
import Link from "next/link";
import { useQuery, withResponse } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { Fragment } from "react";

export interface AssignedStorageProps {
  value?: PersistedResource<StorageUnit>;
  onChange: (newValue: PersistedResource<StorageUnit> | { id: null }) => void;
}

/** Displays the currently assigned Storage, and lets you unlink it. */
export function AssignedStorage({ onChange, value }: AssignedStorageProps) {
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
          let unit: PersistedResource<StorageUnit> | undefined = storageUnit;
          unit;
          unit = unit.parentStorageUnit
        ) {
          storagePath.unshift(unit);
        }

        return (
          <div>
            <div className="mb-3">
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
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onChange({ id: null })}
            >
              <DinaMessage id="removeFromParentStorageUnit" />
            </button>
          </div>
        );
      })}
    </div>
  ) : (
    <DinaMessage id="noneTopLevel" />
  );
}
