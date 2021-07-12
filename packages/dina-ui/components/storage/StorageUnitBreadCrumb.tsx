import Link from "next/link";
import { StorageUnit } from "../../types/collection-api";

export interface StorageUnitBreadCrumbProps {
  disableLastLink?: boolean;
  storageUnit: StorageUnit;
}

export function StorageUnitBreadCrumb({
  disableLastLink,
  storageUnit
}: StorageUnitBreadCrumbProps) {
  const parentPath = [
    ...(storageUnit.parentStorageUnit?.hierarchy ??
      storageUnit.hierarchy?.slice(1) ??
      [])
  ].reverse();

  const unitDisplayName = storageUnitDisplayName(storageUnit);

  return (
    <ol
      className="breadcrumb"
      style={{ "--bs-breadcrumb-divider": "'>'" } as any}
    >
      {parentPath.map(node => (
        <li className="breadcrumb-item" key={node.uuid}>
          <Link href={`/collection/storage-unit/view?id=${node.uuid}`}>
            <a target="_blank">{node.name}</a>
          </Link>
        </li>
      ))}
      <li className="breadcrumb-item">
        <strong>
          {storageUnit.id && !disableLastLink ? (
            <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
              <a target="_blank">{unitDisplayName}</a>
            </Link>
          ) : (
            unitDisplayName
          )}
        </strong>
      </li>
    </ol>
  );
}

export function storageUnitDisplayName({ name, storageUnitType }: StorageUnit) {
  return `${name || ""} ${
    storageUnitType?.name ? `(${storageUnitType.name})` : ""
  }`;
}
