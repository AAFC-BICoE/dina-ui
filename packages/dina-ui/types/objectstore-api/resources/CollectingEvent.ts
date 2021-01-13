import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";

export interface CollectingEventAttributes {
  uuid: string;
  attachment?: ResourceIdentifierObject[];
  startEventDateTime: string;
  endEventDateTime: string;
  verbatimEventDateTime: string;
  createdBy?: string;
  createdOn?: string;
}

export type CollectingEvent = KitsuResource & CollectingEventAttributes;
