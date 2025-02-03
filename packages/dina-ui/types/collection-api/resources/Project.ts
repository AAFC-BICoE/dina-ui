import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";
import { AgentRole } from "../../loan-transaction-api";

export interface ProjectAttributes {
  type: "project";
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  multilingualDescription?: MultilingualDescription;
  createdOn?: string;
  createdBy?: string;
  group?: string;
  extensionValues?: Record<string, string>;
  contributors?: AgentRole[];
}

export interface ProjectRelationships {
  attachment?: ResourceIdentifierObject[];
}

export type Project = KitsuResource & ProjectAttributes & ProjectRelationships;
