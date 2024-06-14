import { KitsuResource } from "kitsu";

export interface StorageUnitTypeAttributes {
  type: "storage-unit-type";
  name: string;
  group: string;
  createdBy?: string;
  createdOn?: string;
  isInseperable?: boolean | null;
  gridLayoutDefinition?: GridLayoutDefinition;

  // client side attribute
  enableGrid?: boolean;
}

export interface GridLayoutDefinition {
  numberOfRows: number;
  numberOfColumns: number;
}
export type StorageUnitType = KitsuResource & StorageUnitTypeAttributes;
