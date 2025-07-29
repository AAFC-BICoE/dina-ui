import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface ExpeditionAttributes {
  type: "expedition";
  name: string;
  startDate?: string;
  endDate?: string;
  geographicContext?: string;
  multilingualDescription?: MultilingualDescription;
  createdOn?: string;
  createdBy?: string;
  group?: string;
}

export interface ExpeditionRelationships {
  participants?: ResourceIdentifierObject[];
}

export type Expedition = KitsuResource &
  ExpeditionAttributes &
  ExpeditionRelationships;
