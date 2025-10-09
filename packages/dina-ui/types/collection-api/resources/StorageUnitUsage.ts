import { KitsuResource } from "kitsu";
import { StorageUnit } from "./StorageUnit";

export interface StorageUnitUsageAttributes {
  type: "storage-unit-usage";
  wellColumn?: number | null;
  wellRow?: string | null;
  storageUnitName?: string;
  usageType?: string;
  createdOn?: string;
  createdBy?: string;
}

export interface StorageUnitUsageCalculatedAttributes {
  cellNumber?: number;
}

export interface StorageUnitUsageRelationships {
  storageUnit?: StorageUnit;
}

export type StorageUnitUsage = KitsuResource &
  StorageUnitUsageAttributes &
  StorageUnitUsageCalculatedAttributes &
  StorageUnitUsageRelationships;
