import { KitsuResource } from "kitsu";

export interface GroupAttributes {
  groupName: string;
  description: string;
}

export type Group = KitsuResource & GroupAttributes;
