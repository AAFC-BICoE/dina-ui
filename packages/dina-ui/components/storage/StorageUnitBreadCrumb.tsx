import Link from "next/link";
import { StorageUnit } from "../../types/collection-api";

export interface StorageUnitBreadCrumbProps {
  disableLastLink?: boolean;
  hideThisUnit?: boolean;
  storageUnit: StorageUnit;
}

export function StorageUnitBreadCrumb({
  disableLastLink,
  hideThisUnit,
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
      className="breadcrumb mb-0"
      style={{ "--bs-breadcrumb-divider": "'>'" } as any}
    >
      {parentPath.map(node => (
        <li className="breadcrumb-item" key={node.uuid}>
          <Link href={`/collection/storage-unit/view?id=${node.uuid}`}>
            <a>
              {node.typeName} {node.name}
            </a>
          </Link>
        </li>
      ))}
      {!hideThisUnit && (
        <li className="breadcrumb-item">
          <strong>
            {storageUnit.id && !disableLastLink ? (
              <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
                <a>{unitDisplayName}</a>
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
  return [storageUnitType?.name, name].filter(it => it).join(" ");
}
