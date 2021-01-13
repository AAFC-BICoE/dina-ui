import { KitsuResource } from "kitsu";
import { CollectorGroup } from "./CollectorGroup";

export interface CollectingEventAttributes {
  uuid: string;
  startEventDateTime: string;
  endEventDateTime: string;
  verbatimEventDateTime: string;
  createdBy?: string;
  createdOn?: string;
  collectorGroupUuid?: string;
  collectorGroup?: CollectorGroup[];
}

export interface CollectingEventRelationships {
  collectors?: KitsuResource[];
}

export type CollectingEvent = KitsuResource &
  CollectingEventAttributes &
  CollectingEventRelationships;
