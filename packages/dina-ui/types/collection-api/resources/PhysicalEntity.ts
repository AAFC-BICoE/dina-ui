import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { CollectingEvent } from "./CollectingEvent";

export interface PhysicalEntityAttributes {
  type: "physical-entity";
  group?: string;
  createdOn?: string;
  createdBy?: string;
  dwcCatalogNumber?: string;
}

export interface PhysicalEntityRelationships {
  collectingEvent?: CollectingEvent;
  attachment?: ResourceIdentifierObject[];
}

export type PhysicalEntity = KitsuResource &
  PhysicalEntityAttributes &
  PhysicalEntityRelationships;
