import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface SiteAttributes {
  type: "site";
  title?: string;
  group?: string;
  code?: string | null;
  multilingualDescription?: MultilingualDescription | null;
  readonly createdOn?: string;
  readonly createdBy?: string;
}

export interface SiteRelationships {
  participants?: ResourceIdentifierObject[];
}

export type Site = KitsuResource & SiteAttributes & SiteRelationships;
