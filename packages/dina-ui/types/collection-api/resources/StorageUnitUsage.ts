import { KitsuResource, PersistedResource } from "kitsu";
import { StorageUnit } from "./StorageUnit";
import { baseRelationshipParser } from "../../baseRelationshipParser";

export interface StorageUnitUsageAttributes {
  type: "storage-unit-usage";
  wellColumn?: number | null;
  wellRow?: string | null;
  cellNumber?: number;
  storageUnitName?: string;
  usageType?: string;
  createdOn?: string;
  createdBy?: string;
}

export interface StorageUnitUsageRelationships {
  storageUnit?: StorageUnit;
}

export type StorageUnitUsage = KitsuResource &
  StorageUnitUsageAttributes &
  StorageUnitUsageRelationships;

export interface StorageUnitUsageResponseRelationships {
  storageUnit?: {
    data?: StorageUnit;
  };
}

export type StorageUnitUsageResponse = KitsuResource &
  StorageUnitUsageAttributes &
  StorageUnitUsageResponseRelationships;

/**
 * Parses a `PersistedResource<StorageUnitUsage>` object and transforms it into a `PersistedResource<StorageUnitUsage>`.
 *
 * This function omits specific relationship properties from the input StorageUnitUsage and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<StorageUnitUsageResponse>`.
 * @returns The parsed StorageUnitUsage resource, of type `PersistedResource<StorageUnitUsage>`.
 */
export function storageUnitUsageParser(
  storageUnitUsage: PersistedResource<StorageUnitUsageResponse>
): PersistedResource<StorageUnitUsage> {
  const parsedStorageUnitUsage = baseRelationshipParser(
    ["storageUnit"],
    storageUnitUsage
  ) as PersistedResource<StorageUnitUsage>;

  return parsedStorageUnitUsage;
}
