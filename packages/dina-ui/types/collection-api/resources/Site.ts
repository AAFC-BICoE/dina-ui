import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "packages/dina-ui/types/common";
import { HasDinaMetaInfo } from "packages/dina-ui/types/DinaJsonMetaInfo";
import type { GeoPolygon } from "packages/dina-ui/types/geo/geo.types";

export type SiteAttributes = {
  type: "site";
  name: string;
  group?: string;
  code?: string | null;
  siteGeom?: GeoPolygon;
  multilingualDescription?: MultilingualDescription | null;
  readonly createdOn?: string;
  readonly createdBy?: string;
};

export type SiteRelationships = {
  attachment?: ResourceIdentifierObject[];
};

export type Site = KitsuResource &
  SiteAttributes &
  SiteRelationships &
  HasDinaMetaInfo;
