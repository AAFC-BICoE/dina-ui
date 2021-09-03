import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import {
  GeographicPlaceNameSourceDetail,
  SourceAdministrativeLevel
} from "./GeographicPlaceNameSourceDetail";
import { CollectorGroup } from "./CollectorGroup";
import { GeoReferenceAssertion } from "./GeoReferenceAssertion";
import { ManagedAttributeValues } from "../../objectstore-api";

import { JsonValue } from "type-fest";

export interface CollectingEventAttributes {
  type: "collecting-event";

  startEventDateTime: string;
  endEventDateTime?: string | null;
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
  dwcOtherRecordNumbers?: string[];
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

  habitat?: string;
  host?: string;

  substrate?: string;
  remarks?: string;

  managedAttributeValues?: ManagedAttributeValues;
  managedAttributes?: JsonValue;
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
