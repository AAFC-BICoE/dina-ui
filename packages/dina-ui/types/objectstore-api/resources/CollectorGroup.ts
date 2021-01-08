import { KitsuResource } from "kitsu";

export interface CollectorGroupAttributes {
  uuid: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
  agentIdentifiers: string[];
}

export type CollectorGroup = KitsuResource & CollectorGroupAttributes;
