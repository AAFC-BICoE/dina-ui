import { KitsuResource } from "kitsu";
import { Group } from "./Group";

export interface ProductAttributes {
  name: string;
  // Optional fields
  upc?: string;
  type?: string;
  description?: string;
  lastModified?: string;
}

export interface ProductRelationships {
  group?: Group;
}

export type Product = KitsuResource & ProductAttributes & ProductRelationships;
