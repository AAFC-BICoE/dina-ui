import { KitsuResource } from "kitsu";

export interface GroupAttributes {
  type: "group";
  groupName: string;
  description?: string | null;
}

export type Group = KitsuResource & GroupAttributes;
