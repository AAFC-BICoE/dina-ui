import { KitsuResource } from "kitsu";

export interface AgentAttributes {
  type: "person";
  displayName: string;
  email: string;
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export type Person = KitsuResource & AgentAttributes;
