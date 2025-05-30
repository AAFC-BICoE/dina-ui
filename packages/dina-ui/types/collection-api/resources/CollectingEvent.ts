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
