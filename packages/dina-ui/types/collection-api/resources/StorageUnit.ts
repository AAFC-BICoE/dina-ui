import { KitsuResource } from "kitsu";
import { StorageUnitType } from "./StorageUnitType";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

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
  StorageUnitRelationships &
  HasDinaMetaInfo;
