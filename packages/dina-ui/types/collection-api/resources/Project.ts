import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

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
}

export interface ProjectRelationships {
  attachment?: ResourceIdentifierObject[];
}

export type Project = KitsuResource & ProjectAttributes & ProjectRelationships;
