import { KitsuResource } from "kitsu";
import { StorageUnitType } from "./StorageUnitType";

export interface StorageUnitAttributes {
  type: "storage-unit";
  name: string;
  group: string;
  createdOn?: string;
  createdBy?: string;
}

export interface StorageUnitRelationships {
  storageUnitType?: StorageUnitType;
  parentStorageUnit?: StorageUnit;
  storageUnitChildren?: StorageUnit[];
}

export type StorageUnit = KitsuResource &
  StorageUnitAttributes &
  StorageUnitRelationships;
