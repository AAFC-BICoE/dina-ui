import { KitsuResource } from "kitsu";

export interface IndexSetAttributes {
  type: "index-set";
  name: string;
  forwardAdapter?: string;
  reverseAdapter?: string;
  createdBy?: string;
  createdOn?: string;
}

export type IndexSet = KitsuResource & IndexSetAttributes;
