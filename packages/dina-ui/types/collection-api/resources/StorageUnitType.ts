import { KitsuResource } from "kitsu";

export interface StorageUnitTypeAttributes {
  type: "storage-unit-type";
  name: string;
  group: string;
  createdBy?: string;
  createdOn?: string;
}

export type StorageUnitType = KitsuResource & StorageUnitTypeAttributes;
