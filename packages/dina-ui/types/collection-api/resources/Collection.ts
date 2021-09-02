import { KitsuResource } from "kitsu";
import { object, string } from "yup";

export interface CollectionAttributes {
  type: "collection";
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
}

export const ImportCollection = object({
  group: string().required(),
  name: string().required(),
  code: string().required(),
  createdOn: string(),
  createdBy: string()
}).label("container");

export type Collection = KitsuResource & CollectionAttributes;
