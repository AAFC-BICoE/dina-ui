import { KitsuResource } from "kitsu";

export interface AgentAttributes {
  type: "agent";
  displayName: string;
  email: string;
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export type Agent = KitsuResource & AgentAttributes;
