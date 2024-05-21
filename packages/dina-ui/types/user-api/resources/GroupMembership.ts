import { KitsuResource } from "kitsu";

export interface GroupMembershipAttributes {
  type: "group-membership";
  name: string;
  managedBy?: UserSummary[];
}

export interface UserSummary {
  username?: string;
  agentId?: string;
}

export type GroupMembership = KitsuResource & GroupMembershipAttributes;
