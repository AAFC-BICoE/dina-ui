import { KitsuResource } from "kitsu";

export interface GroupAttributes {
  type: "group";
  groupName: string;
  description?: string;
}

export type Group = KitsuResource & GroupAttributes;
