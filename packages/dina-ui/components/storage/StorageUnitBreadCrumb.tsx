import Link from "next/link";
import { StorageUnit } from "../../types/collection-api";

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

  return (
    <ol
      className="breadcrumb mb-0"
      style={{ "--bs-breadcrumb-divider": "'>'" } as any}
    >
      {parentPath.map((node) => (
        <li className="breadcrumb-item" key={node.uuid}>
          <Link href={`/collection/storage-unit/view?id=${node.uuid}`}>
            <a>
              {node.name} ({node.typeName})
            </a>
          </Link>
        </li>
      ))}
      {!hideThisUnit && (
        <li className="breadcrumb-item">
          <strong>
            {storageUnit.id && !disableLastLink ? (
              <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
                <a target={newTab ? "_blank" : undefined}>{unitDisplayName}</a>
              </Link>
            ) : (
              unitDisplayName
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
