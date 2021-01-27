import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { CollectorGroup } from "./CollectorGroup";

export interface CollectingEventAttributes {
  uuid: string;
  attachment?: ResourceIdentifierObject[];
  startEventDateTime: string;
  endEventDateTime: string;
  verbatimCollectors?: string;
  verbatimEventDateTime: string;
  createdBy?: string;
  createdOn?: string;
  collectorGroupUuid?: string;
  collectorGroups?: CollectorGroup[];
  group: string;
}

export interface CollectingEventRelationships {
  collectors?: KitsuResource[];
}

export type CollectingEvent = KitsuResource &
  CollectingEventAttributes &
  CollectingEventRelationships;
