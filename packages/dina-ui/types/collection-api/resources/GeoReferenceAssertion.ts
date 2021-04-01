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
}

export interface GeoReferenceAssertionRelationships {
  collectingEvent?: CollectingEvent;
  georeferencedBy?: KitsuResource[];
}

export type GeoReferenceAssertion = KitsuResource &
  GeoReferenceAssertionAttributes &
  GeoReferenceAssertionRelationships;
