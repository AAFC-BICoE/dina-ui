import { KitsuResource } from "kitsu";

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
  georeferencedBy?: KitsuResource[];
}

export type GeoReferenceAssertion = KitsuResource &
  GeoReferenceAssertionAttributes &
  GeoReferenceAssertionRelationships;
