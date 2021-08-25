import { KitsuResource } from "kitsu";

export interface CollectionAttributes {
  type: "collection";
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
}

export type Collection = KitsuResource & CollectionAttributes;
