import Link from "next/link";
import { StorageUnit } from "../../types/collection-api";
import { Tooltip } from "../../../common-ui/lib";

export interface StorageUnitBreadCrumbProps {
  disableLastLink?: boolean;
  hideThisUnit?: boolean;
  storageUnit: StorageUnit;
  newTab?: boolean;
}

export function StorageUnitBreadCrumb({
  disableLastLink,
  hideThisUnit,
  storageUnit,
  newTab
}: StorageUnitBreadCrumbProps) {
  const parentPath = [
    ...(storageUnit.parentStorageUnit?.hierarchy ??
      storageUnit.hierarchy?.slice(1) ??
      [])
  ].reverse();

  const unitDisplayName = storageUnitDisplayName(storageUnit);

  // Add parents to hierarchy array
  const hierarchy = parentPath.map((node, index) => (
    <Link
      href={`/collection/storage-unit/view?id=${node.uuid}`}
      key={index}
      style={{ color: "#fff" }}
    >
      {`${node.name} (${node.typeName})`}
    </Link>
  ));

  // Add selected storage unit to array
  hierarchy.push(
    <Link
      href={`/collection/storage-unit/view?id=${storageUnit.id}`}
      style={{ color: "#fff" }}
      target={newTab ? "_blank" : undefined}
    >
      {unitDisplayName}
    </Link>
  );

  return (
    <ol className="breadcrumb breadcrumb-arrow mb-0">
      {!hideThisUnit && (
        <li className="breadcrumb-item">
          <strong>
            {storageUnit.id && !disableLastLink ? (
              <Link
                href={`/collection/storage-unit/view?id=${storageUnit.id}`}
                target={newTab ? "_blank" : undefined}
              >
                {unitDisplayName}
              </Link>
            ) : (
              unitDisplayName
            )}
            {!!parentPath.length && (
              <Tooltip
                directComponent={hierarchy.map((unit, index) => {
                  return (
                    <>
                      {unit} {index !== hierarchy.length - 1 && " > "}
                    </>
                  );
                })}
              />
            )}
          </strong>
        </li>
      )}
    </ol>
  );
}

export function storageUnitDisplayName({ name, storageUnitType }: StorageUnit) {
  return name + " (" + storageUnitType?.name + ")";
}
