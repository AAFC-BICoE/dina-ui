import { KitsuResource } from "kitsu";

export interface StorageUnitTypeAttributes {
  type: "storage-unit-type";
  name: string;
  group: string;
  createdBy?: string;
  createdOn?: string;
  isInseperable?: boolean | null;
  enableGrid?: boolean;
  gridLayoutDefinition?: GridLayoutDefinition;
}

export interface GridLayoutDefinition {
  numberOfRows: number;
  numberOfColumns: number;
}
export type StorageUnitType = KitsuResource & StorageUnitTypeAttributes;
