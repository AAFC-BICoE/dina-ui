import { KitsuResource } from "kitsu";

export interface UserGroupAttributes {
  name: string;
  path: string;
  labels: Map<string, string>;
}

export type UserGroup = KitsuResource & UserGroupAttributes;
