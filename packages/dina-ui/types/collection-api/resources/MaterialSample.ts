import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { CollectingEvent } from "./CollectingEvent";

export interface MaterialSampleAttributes {
  type: "material-sample";
  group?: string;
  createdOn?: string;
  createdBy?: string;
  dwcCatalogNumber?: string;
}

export interface MaterialSampleRelationships {
  collectingEvent?: CollectingEvent;
  attachment?: ResourceIdentifierObject[];
}

export type MaterialSample = KitsuResource &
  MaterialSampleAttributes &
  MaterialSampleRelationships;
