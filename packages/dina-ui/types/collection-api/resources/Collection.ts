import { KitsuResource } from "kitsu";

export interface CollectionAttributes {
  type: "collection";
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
}

export const PERMISSIONS = ["create", "update", "delete"] as const;

export type Collection = KitsuResource & CollectionAttributes;
