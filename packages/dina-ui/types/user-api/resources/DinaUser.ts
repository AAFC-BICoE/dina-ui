import { KitsuResource } from "kitsu";

export interface DinaUserAttributes {
  type: "user";
  username: string;
  emailAddress: string;
  groups: string[];
  roles: string[];
  agentId: string;
  firstName?: string;
  lastName?: string;
  rolesPerGroup: Record<string, string[] | undefined>;
  adminRoles: string[];
}

export type DinaUser = KitsuResource & DinaUserAttributes;
