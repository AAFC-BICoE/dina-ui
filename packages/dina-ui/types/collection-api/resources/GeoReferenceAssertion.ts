import { KitsuResource } from "kitsu";

export interface GeoReferenceAssertionAttributes {
  uuid: string;
  createdBy?: string;
  createdOn?: string;
  dwcDecimalLatitude?: number;
  dwcDecimalLongitude?: number;
  dwcCoordinateUncertaintyInMeters?: number;
}

export type GeoReferenceAssertion = KitsuResource &
  GeoReferenceAssertionAttributes;
