import { KitsuResource, PersistedResource } from "kitsu";
import { StorageUnitType } from "./StorageUnitType";
import { baseRelationshipParser } from "../../baseRelationshipParser";

export interface StorageUnitAttributes {
  type: "storage-unit";
  name: string;
  group: string;
  hierarchy?: StorageHierarchyItem[];
  createdOn?: string;
  createdBy?: string;
  storageUnitChildren?: StorageUnit[];
  uuid?: string;
  isMultiple?: boolean | null;
  isGeneric?: boolean;
  barcode?: string;
}

export interface HierarchyItem {
  organismPrimaryDetermination?: any;
  uuid: string;
  name: string;
  rank?: number;
}

export interface StorageHierarchyItem extends HierarchyItem {
  typeName: string;
  typeUuid: string;
}

export interface StorageUnitRelationships {
  storageUnitType?: StorageUnitType;
  parentStorageUnit?: StorageUnit;
}

export type StorageUnit = KitsuResource &
  StorageUnitAttributes &
  StorageUnitRelationships;

export interface StorageUnitResponseRelationships {
  storageUnitType?: {
    data?: StorageUnitType;
  };
  parentStorageUnit?: {
    data?: StorageUnit;
  };
}

export type StorageUnitResponse = KitsuResource &
  StorageUnitAttributes &
  StorageUnitResponseRelationships;

/**
 * Parses a `PersistedResource<StorageUnitResponse>` object and transforms it into a `PersistedResource<StorageUnit>`.
 *
 * This function omits specific relationship properties from the input storage unit and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<StorageUnitResponse>`.
 * @returns The parsed storage unit resource, of type `PersistedResource<StorageUnit>`.
 */
export function storageUnitParser(
  storageUnit: PersistedResource<StorageUnitResponse>
): PersistedResource<StorageUnit> {
  const parsedStorageUnit = baseRelationshipParser(
    ["storageUnitType", "parentStorageUnit"],
    storageUnit
  ) as PersistedResource<StorageUnit>;
  return parsedStorageUnit;
}
