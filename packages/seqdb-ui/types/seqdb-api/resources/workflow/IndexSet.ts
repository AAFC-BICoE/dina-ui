import { KitsuResource } from "kitsu";

export interface IndexSetAttributes {
  type: "indexSet";
  name: string;
}

export type IndexSet = KitsuResource & IndexSetAttributes;
