import { KitsuResource } from "kitsu";
import { Person } from "./Person";

export interface CollectorGroupAttributes {
  uuid: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
  agentIdentifiers: string[];
  agents?: Person[];
}

export type CollectorGroup = KitsuResource & CollectorGroupAttributes;
