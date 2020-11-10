import { KitsuResource } from "kitsu";

export interface ProductAttributes {
  name: string;
  // Optional fields
  group?: string;
  upc?: string;
  type?: string;
  description?: string;
  lastModified?: string;
}

export type Product = KitsuResource & ProductAttributes;
