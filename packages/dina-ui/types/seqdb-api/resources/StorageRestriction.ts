import { KitsuResource } from "kitsu";

export interface StorageRestrictionAttributes {
    type: "storage-restriction";
    numberOfColumns: number;
    numberOfRows: number;
    fillDirection: any;
  }
  
  export type StorageRestriction = KitsuResource & StorageRestrictionAttributes;