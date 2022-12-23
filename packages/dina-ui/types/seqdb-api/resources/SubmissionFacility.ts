import { KitsuResource } from "kitsu";

export interface SubmissionFacilityAttributes {
  type: "sequencing-facility";
  group?: string;
  createdBy?: string;
  createdOn?: string;
  contacts?: {
    name?: string;
    roles?: string[];
    info?: string;
  }[];
  shippingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    provinceState?: string;
    zipCode?: string;
    country?: string;
  };
}

export type SubmissionFacility = KitsuResource & SubmissionFacilityAttributes;
