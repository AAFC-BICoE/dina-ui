import { KitsuResource } from "kitsu";
import { CollectingEvent } from "./CollectingEvent";

export interface GeoReferenceAssertionAttributes {
  createdBy?: string;
  createdOn?: string;
  dwcDecimalLatitude?: number;
  dwcDecimalLongitude?: number;
  dwcCoordinateUncertaintyInMeters?: number;
  dwcGeoreferencedDate?: string;
  literalGeoreferencedBy?: string;
  dwcGeoreferenceProtocol?: string;
  dwcGeoreferenceSources?: string;
  dwcGeoreferenceRemarks?: string;
  dwcGeoreferenceVerificationStatus?: GeoreferenceVerificationStatus;
}

export enum GeoreferenceVerificationStatus {
  GEOREFERENCING_NOT_POSSIBLE = "GEOREFERENCING_NOT_POSSIBLE"
}

export interface GeoReferenceAssertionRelationships {
  collectingEvent?: CollectingEvent;
  georeferencedBy?: KitsuResource[];
}

export type GeoReferenceAssertion = KitsuResource &
  GeoReferenceAssertionAttributes &
  GeoReferenceAssertionRelationships;
