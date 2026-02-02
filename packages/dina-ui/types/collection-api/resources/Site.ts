import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface SiteAttributes {
  type: "site";
  name: string;
  startDate?: string;
  endDate?: string;
  geographicContext?: string;
  multilingualDescription?: MultilingualDescription;
  createdOn?: string;
  createdBy?: string;
  group?: string;
}

export interface SiteRelationships {
  participants?: ResourceIdentifierObject[];
}

export type Site = KitsuResource &
  SiteAttributes &
  SiteRelationships;
