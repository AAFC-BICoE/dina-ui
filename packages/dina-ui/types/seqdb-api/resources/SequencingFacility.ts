import { KitsuResource } from "kitsu";

export interface SequencingFacilityContact {
  name?: string;
  roles?: string[];
  info?: string;
}

export interface SequencingFacilityAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  provinceState?: string;
  zipCode?: string;
  country?: string;
}

export interface SequencingFacilityAttributes {
  type: "sequencing-facility";
  group?: string;
  createdBy?: string;
  createdOn?: string;
  contacts?: SequencingFacilityContact[];
  shippingAddress?: SequencingFacilityAddress;
}

export type SequencingFacility = KitsuResource & SequencingFacilityAttributes;
