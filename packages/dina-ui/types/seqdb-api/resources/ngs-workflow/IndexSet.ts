import { KitsuResource } from "kitsu";

export interface IndexSetAttributes {
  type: "index-set";
  name: string;
}

export type IndexSet = KitsuResource & IndexSetAttributes;
