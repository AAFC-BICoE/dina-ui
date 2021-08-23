import { KitsuResource } from "kitsu";

export interface CollectionMethodAttributes {
  type: "collection-method";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
}

export type CollectionMethod = KitsuResource & CollectionMethodAttributes;
