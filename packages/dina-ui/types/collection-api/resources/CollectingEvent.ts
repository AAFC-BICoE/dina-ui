import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import {
  GeographicPlaceNameSourceDetail,
  SourceAdministrativeLevel
} from "./GeographicPlaceNameSourceDetail";
import { GeographicThesaurus } from "./GeographicThesaurus";
import { CollectorGroup } from "./CollectorGroup";
import { GeoReferenceAssertion } from "./GeoReferenceAssertion";
import { ManagedAttributeValues } from "./ManagedAttribute";

import { JsonValue } from "type-fest";
import { Protocol } from "./Protocol";
import { DinaJsonMetaInfo } from "../../DinaJsonMetaInfo";

export interface CollectingEventAttributes {
  type: "collecting-event";

  dwcFieldNumber?: string;
  startEventDateTime?: string | null | undefined;
  endEventDateTime?: string | null;
  dwcRecordedBy?: string;
  verbatimEventDateTime?: string;

  dwcVerbatimLocality?: string;
  dwcVerbatimLatitude?: string;
  dwcVerbatimLongitude?: string;
  dwcVerbatimCoordinates?: string;
  dwcVerbatimCoordinateSystem?: string | null;
  dwcVerbatimSRS?: string;
  dwcVerbatimElevation?: string;
  dwcVerbatimDepth?: string;
  otherRecordNumbers?: string[];
  dwcRecordNumber?: string;
  dwcMinimumElevationInMeters?: number;
  dwcMinimumDepthInMeters?: number;
  dwcMaximumElevationInMeters?: number;
  dwcMaximumDepthInMeters?: number;

  dwcCountry?: string;
  dwcCountryCode?: string;
  dwcStateProvince?: string;
  dwcMunicipality?: string;

  createdBy?: string;
  createdOn?: string;
  collectorGroupUuid?: string;

  group?: string;
  geographicPlaceNameSourceDetail?: GeographicPlaceNameSourceDetail;
  geographicPlaceNameSource?: GeographicPlaceNameSource;
  srcAdminLevels?: SourceAdministrativeLevel[];

  geographicThesaurus?: GeographicThesaurus;

  habitat?: string;
  host?: string;

  substrate?: string;
  remarks?: string;

  publiclyReleasable?: boolean;
  notPubliclyReleasableReason?: string;

  managedAttributeValues?: ManagedAttributeValues;
  managedAttributes?: JsonValue;

  selectedSections?: string[];
  extensionValues?: any;
  protocol?: Protocol;

  // Used for permission information included on the request.
  meta?: DinaJsonMetaInfo;
}

export enum GeographicPlaceNameSource {
  OSM = "OSM"
}

export interface CollectingEventRelationships {
  attachment?: ResourceIdentifierObject[];
  collectors?: KitsuResource[];
  collectorGroups?: CollectorGroup[];
  geoReferenceAssertions?: GeoReferenceAssertion[];
}

export type CollectingEvent = KitsuResource &
  CollectingEventAttributes &
  CollectingEventRelationships;

export interface CollectingEventResponseAttributes {
  dwcFieldNumber?: string;
  startEventDateTime?: string | null | undefined;
  endEventDateTime?: string | null;
  dwcRecordedBy?: string;
  verbatimEventDateTime?: string;

  dwcVerbatimLocality?: string;
  dwcVerbatimLatitude?: string;
  dwcVerbatimLongitude?: string;
  dwcVerbatimCoordinates?: string;
  dwcVerbatimCoordinateSystem?: string | null;
  dwcVerbatimSRS?: string;
  dwcVerbatimElevation?: string;
  dwcVerbatimDepth?: string;
  otherRecordNumbers?: string[];
  dwcRecordNumber?: string;
  dwcMinimumElevationInMeters?: number;
  dwcMinimumDepthInMeters?: number;
  dwcMaximumElevationInMeters?: number;
  dwcMaximumDepthInMeters?: number;

  dwcCountry?: string;
  dwcCountryCode?: string;
  dwcStateProvince?: string;
  dwcMunicipality?: string;

  createdBy?: string;
  createdOn?: string;
  collectorGroupUuid?: string;

  group?: string;
  geographicPlaceNameSourceDetail?: GeographicPlaceNameSourceDetail;
  geographicPlaceNameSource?: GeographicPlaceNameSource;
  srcAdminLevels?: SourceAdministrativeLevel[];

  geographicThesaurus?: GeographicThesaurus;

  habitat?: string;
  host?: string;

  substrate?: string;
  remarks?: string;

  publiclyReleasable?: boolean;
  notPubliclyReleasableReason?: string;

  managedAttributeValues?: ManagedAttributeValues;
  managedAttributes?: JsonValue;

  selectedSections?: string[];
  extensionValues?: any;
  protocol?: Protocol;

  // Used for permission information included on the request.
  meta?: DinaJsonMetaInfo;
}

export interface CollectingEventResponseRelationships {
  attachment?: {
    data?: ResourceIdentifierObject[];
  };
  collectors?: {
    data?: KitsuResource[];
  };
  collectorGroups?: {
    data?: CollectorGroup[];
  };
  geoReferenceAssertions?: {
    data?: GeoReferenceAssertion[];
  };
}
export interface CollectingEventResponse {
  type: "collecting-event";
  id: string; // ID is required for all resources
  attributes?: CollectingEventResponseAttributes;
  relationships?: CollectingEventResponseRelationships;
}

/**
 * Parses the relationships object from a CollectingEvent API response and extracts
 * the relevant relationship data into a simplified structure.
 *
 * @param relationships - The relationships object from the CollectingEvent API response.
 * @returns An object containing the parsed relationship data for attachments, collectors,
 *          collector groups, and geo-reference assertions.
 */
export function CollectingEventRelationshipParser(
  relationships: CollectingEventResponseRelationships
): CollectingEventRelationships {
  return {
    attachment: relationships.attachment?.data,
    collectors: relationships.collectors?.data,
    collectorGroups: relationships.collectorGroups?.data,
    geoReferenceAssertions: relationships.geoReferenceAssertions?.data
  };
}

// /**
//  * Parses a CollectingEventResponse object and transforms it into a CollectingEvent object.
//  *
//  * @param response - The CollectingEventResponse object to parse.
//  * @returns The parsed CollectingEvent object, including its attributes and relationships.
//  */
// export function CollectingEventParser(
//   response: CollectingEventResponse
// ): CollectingEvent {
//   const relationships = CollectingEventRelationshipParser(
//     response.relationships || {}
//   );
//   return {
//     id: response.id,
//     type: response.type,
//     ...(response.attributes || {}),
//     ...relationships
//   };
// }

export function collectingEventParser(collectingEvent) {
  collectingEvent.attachment = collectingEvent.attachment?.data;
  collectingEvent.collectors = collectingEvent.collectors?.data;
  collectingEvent.collectorGroups = collectingEvent.collectorGroups?.data;
  collectingEvent.geoReferenceAssertions =
    collectingEvent.geoReferenceAssertions?.data;

  return collectingEvent;
}
