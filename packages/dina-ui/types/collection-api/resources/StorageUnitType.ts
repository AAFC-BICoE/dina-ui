import { KitsuResource } from "kitsu";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

export interface StorageUnitTypeAttributes {
  type: "storage-unit-type";
  name: string;
  group: string;
  createdBy?: string;
  createdOn?: string;
  gridLayoutDefinition?: GridLayoutDefinition;

  // client side attribute
  enableGrid?: boolean;
}

export interface GridLayoutDefinition {
  numberOfRows: number;
  numberOfColumns: number;
  fillDirection: string;
}
export type StorageUnitType = KitsuResource &
  StorageUnitTypeAttributes &
  HasDinaMetaInfo;
