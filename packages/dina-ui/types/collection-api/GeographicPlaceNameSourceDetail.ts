import { KitsuResource } from "kitsu";

export interface GeographicPlaceNameSourceDetailAttributes {
  sourceID: string
  sourceIdType: string
  sourceUrl: string;
  recordedOn: string;
}

export const geographicPlaceSourceUrl = "https://www.openstreetmap.org";

export type GeographicPlaceNameSourceDetail = KitsuResource &
GeographicPlaceNameSourceDetailAttributes