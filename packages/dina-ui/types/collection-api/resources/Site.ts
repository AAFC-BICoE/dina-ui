import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "packages/dina-ui/types/common";
import { GeoPolygon } from "packages/dina-ui/types/geo/geopolygon";

export interface SiteAttributes {
  type: "site";
  name?: string;
  group?: string;
  code?: string | null;
  siteGeom: GeoPolygon;
  multilingualDescription?: MultilingualDescription | null;
  readonly createdOn?: string;
  readonly createdBy?: string;
}

export interface SiteRelationships {
  attachment?: ResourceIdentifierObject[];
}

export type Site = KitsuResource & SiteAttributes & SiteRelationships;
