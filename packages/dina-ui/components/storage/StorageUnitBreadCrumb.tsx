import Link from "next/link";
import { StorageUnit } from "../../types/collection-api";

export interface StorageUnitBreadCrumbProps {
  disableLastLink?: boolean;
  storageUnit: StorageUnit;
  readOnly?: boolean;
}

export function StorageUnitBreadCrumb({
  disableLastLink,
  storageUnit,
  readOnly
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
            <a target={!readOnly ? "_blank" : ""}>
              {node.typeName} {node.name}
            </a>
          </Link>
        </li>
      ))}
      <li className="breadcrumb-item">
        <strong>
          {storageUnit.id && !disableLastLink ? (
            <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
              <a target={!readOnly ? "_blank" : ""}>{unitDisplayName}</a>
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
  return [storageUnitType?.name, name].filter(it => it).join(" ");
}
