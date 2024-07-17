import { KitsuResource } from "kitsu";
import { StorageUnit } from "./StorageUnit";

export interface StorageUnitUsageAttributes {
  type: "storage-unit-usage";
  wellColumn?: number;
  wellRow?: string;
  createdOn?: string;
  createdBy?: string;
  cellNumber?: number;
}

export interface StorageUnitUsageRelationships {
  storageUnit?: StorageUnit;
}

export type StorageUnitUsage = KitsuResource &
  StorageUnitUsageAttributes &
  StorageUnitUsageRelationships;
