import { KitsuResource } from "kitsu";

export interface AgentAttributes {
  type: "agent";
  displayName: string;
  email: string;
  uuid: string;
}

export type Agent = KitsuResource & AgentAttributes;
