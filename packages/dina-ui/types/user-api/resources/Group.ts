import { KitsuResource } from "kitsu";

export interface GroupAttributes {
  type: "group";
  name: string;
  path: string;
  labels: Record<string, string>;
  roles: string[];
}

export type Group = KitsuResource & GroupAttributes;
