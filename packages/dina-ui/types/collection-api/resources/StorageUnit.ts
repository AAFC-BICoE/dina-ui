import { KitsuResource } from "kitsu";

export interface StorageUnitAttributes {
  type: "storage-unit";
  name: string;
  group: string;
  createdOn?: string;
  createdBy?: string;
}

export interface StorageUnitRelationships {
  parentStorageUnit?: StorageUnit;
}

export type StorageUnit = KitsuResource &
  StorageUnitAttributes &
  StorageUnitRelationships;
