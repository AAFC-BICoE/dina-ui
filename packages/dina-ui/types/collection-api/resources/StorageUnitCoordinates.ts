import { KitsuResource } from "kitsu";
import { StorageUnit } from "./StorageUnit";

export interface StorageUnitCoordinatesAttributes {
  type: "storage-unit-coordinates";
  wellColumn?: number;
  wellRow?: string;
  createdOn?: string;
  createdBy?: string;
}

export interface StorageUnitCoordinatesRelationships {
  storageUnit?: StorageUnit;
}

export type StorageUnitCoordinates = KitsuResource &
  StorageUnitCoordinatesAttributes &
  StorageUnitCoordinatesRelationships;
