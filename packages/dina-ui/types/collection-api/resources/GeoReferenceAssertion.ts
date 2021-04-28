import { Person } from "../../objectstore-api";

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
  dwcGeodeticDatum?: string;
  dwcGeoreferenceVerificationStatus?: GeoreferenceVerificationStatus;
  isPrimary?: boolean;
  georeferencedBy?: (string | Person)[];
}

export enum GeoreferenceVerificationStatus {
  GEOREFERENCING_NOT_POSSIBLE = "GEOREFERENCING_NOT_POSSIBLE"
}

export type GeoReferenceAssertion = GeoReferenceAssertionAttributes;
