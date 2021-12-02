import Link from "next/link";
import { useDinaFormContext } from "../../../common-ui/lib/formik-connected/DinaForm";
import { StorageUnit } from "../../types/collection-api";

export interface StorageUnitBreadCrumbProps {
  disableLastLink?: boolean;
  storageUnit: StorageUnit;
}

export function StorageUnitBreadCrumb({
  disableLastLink,
  storageUnit
}: StorageUnitBreadCrumbProps) {
  const { readOnly } = useDinaFormContext();
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
