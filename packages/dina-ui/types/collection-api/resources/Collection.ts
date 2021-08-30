import { KitsuResource } from "kitsu";

export interface CollectionAttributes {
  type: "collection";
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
  // Add meta here as unlike other attribute fields, it will remain as is/not flattened out in response
  meta?: CollectionMeta;
}

export interface CollectionMeta {
  permissionsProvider?: string;
  permissions?: string[];
  warnings?: any;
}

export const PERMISSIONS = ["create", "update", "delete"] as const;

export type Collection = KitsuResource & CollectionAttributes;
