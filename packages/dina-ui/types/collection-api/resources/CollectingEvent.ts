import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import {
  GeographicPlaceNameSourceDetail,
  SourceAdministrativeLevel
} from "./GeographicPlaceNameSourceDetail";
import { CollectorGroup } from "./CollectorGroup";
import { GeoReferenceAssertion } from "./GeoReferenceAssertion";
import { ManagedAttributeValues } from "../../objectstore-api";

export interface CollectingEventAttributes {
  type: "collecting-event";
  uuid: string;

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

  dwcCountry?: string;
  dwcCountryCode?: string;
  dwcStateProvince?: string;
  dwcMunicipality?: string;

  createdBy?: string;
  createdOn?: string;
  collectorGroupUuid?: string;

  group: string;
  geographicPlaceNameSourceDetail?: GeographicPlaceNameSourceDetail;
  geographicPlaceNameSource?: GeographicPlaceNameSource;
  srcAdminLevels?: SourceAdministrativeLevel[];

  habitat?: string;

  managedAttributeValues?: ManagedAttributeValues;

  /** For template purpose */
  includeAllCollectingDate?: boolean;
  startEventDateTimeEnabled?: boolean;
  endEventDateTimeEnabled?: boolean;
  dwcRecordedByEnabled?: boolean;
  verbatimEventDateTimeEnabled?: boolean;

  includeAllVerbatimCoordinates?: boolean;
  dwcVerbatimLocalityEnabled?: boolean;
  dwcVerbatimLatitudeEnabled?: boolean;
  dwcVerbatimLongitudeEnabled?: boolean;
  dwcVerbatimCoordinatesEnabled?: boolean;
  dwcVerbatimCoordinateSystemEnabled?: boolean;
  dwcVerbatimSRSEnabled?: boolean;
  dwcVerbatimElevationEnabled?: boolean;
  dwcVerbatimDepthEnabled?: boolean;

  includeAllCollectingAgent?: boolean;
  dwcOtherRecordNumbersEnabled?: boolean;
  dwcRecordNumberEnabled?: boolean;
  habitatEnabled?: boolean;

  // For location template
  locationSearchValue?: string;
  locationSearchValueEnabled?: boolean;
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
