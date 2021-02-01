import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { CollectorGroup } from "./CollectorGroup";

export interface CollectingEventAttributes {
  uuid: string;
  attachment?: ResourceIdentifierObject[];
  startEventDateTime: string;
  endEventDateTime?: string;
  dwcRecordedBy?: string;
  verbatimEventDateTime?: string;

  dwcVerbatimLocality?: string;
  dwcVerbatimLatitude?: string;
  dwcVerbatimLongitude?: string;
  dwcVerbatimCoordinates?: string;
  dwcVerbatimCoordinateSystem?: string;
  dwcVerbatimSRS?: string;
  dwcVerbatimElevation?: string;
  dwcVerbatimDepth?: string;

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
