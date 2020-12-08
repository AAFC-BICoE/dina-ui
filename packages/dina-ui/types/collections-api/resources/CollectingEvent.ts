import { KitsuResource } from "kitsu";

export interface CollectingEventAttributes {
  type: "collectingEvent";
  decimalLatitude: number;
  decimalLongitude: number;
  verbatimCoordinates: string;
  coordinateUncertaintyInMeters: number;
  countryCode: string;
  stateProvince: string;
  municipality: string;
  verbatimLocality: string;
  eventDateTime: string;
  verbatimEventDateTime: string;
  fieldObservation: string;
}

export type CollectingEvent = KitsuResource & CollectingEventAttributes;
