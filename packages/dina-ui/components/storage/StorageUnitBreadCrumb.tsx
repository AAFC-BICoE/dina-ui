import { StorageUnit } from "../../types/collection-api";
import { ExternalLink, Tooltip } from "../../../common-ui/lib";

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

  // Add parents to hierarchy array
  const hierarchy = parentPath.map((node, index) => (
    <ExternalLink
      href={`/collection/storage-unit/view?id=${node.uuid}`}
      style={{ color: "#fff" }}
      key={index}
    >
      {`${node.name} (${node.typeName})`}
    </ExternalLink>
  ));

  // Add selected storage unit to array
  hierarchy.push(
    <ExternalLink
      href={`/collection/storage-unit/view?id=${storageUnit.id}`}
      style={{ color: "#fff" }}
    >
      {unitDisplayName}
    </ExternalLink>
  );

  return (
    <ol className="breadcrumb breadcrumb-arrow mb-0">
      {!hideThisUnit && (
        <li className="breadcrumb-item">
          <strong>
            {storageUnit.id && !disableLastLink ? (
              <ExternalLink
                href={`/collection/storage-unit/view?id=${storageUnit.id}`}
              >
                {unitDisplayName}
              </ExternalLink>
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
