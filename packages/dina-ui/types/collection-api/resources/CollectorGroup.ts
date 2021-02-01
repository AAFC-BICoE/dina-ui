import { KitsuResource } from "kitsu";
import { Person } from "../../agent-api/resources/Person";

export interface CollectorGroupAttributes {
  uuid: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
  agents?: Person[];
}

export interface CollectorGroupRelationships {
  agentIdentifiers?: KitsuResource[];
}
export type CollectorGroup = KitsuResource &
  CollectorGroupAttributes &
  CollectorGroupRelationships;
