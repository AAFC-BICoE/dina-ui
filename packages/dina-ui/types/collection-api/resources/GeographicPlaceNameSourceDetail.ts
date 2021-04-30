import { KitsuResource } from "kitsu";

export interface GeographicPlaceNameSourceDetailAttributes {
  selectedGeographicPlace: SourceAdministrativeLevel[];
  higherGeographicPlaces: SourceAdministrativeLevel[];
  stateProvince: SourceAdministrativeLevel;
  country: Country;
  sourceUrl: string;
  recordedOn: string;
}

export const geographicPlaceSourceUrl = "https://www.openstreetmap.org";

export type SourceAdministrativeLevel = {
  id: string;
  element: string;
  placeType: string;
  name: string;
};

export type Country = {
  code: string;
  name: string;
};

export type GeographicPlaceNameSourceDetail = KitsuResource &
  GeographicPlaceNameSourceDetailAttributes;
