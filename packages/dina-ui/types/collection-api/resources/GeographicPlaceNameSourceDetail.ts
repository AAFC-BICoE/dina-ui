import { KitsuResource } from "kitsu";

export interface GeographicPlaceNameSourceDetailAttributes {
  customGeographicPlace?: string;
  selectedGeographicPlace?: SourceAdministrativeLevel;
  higherGeographicPlaces?: SourceAdministrativeLevel[];
  stateProvince?: SourceAdministrativeLevel;
  country?: Country;
  sourceUrl: string;
  recordedOn: string;
}

export const geographicPlaceSourceUrl = "https://www.openstreetmap.org";

export type SourceAdministrativeLevel = {
  id?: string /* osm id */;
  element?: string /* osm type */;
  placeType?: string /* place type or class type */;
  name?: string;
};

export type Country = {
  code?: string;
  name?: string;
};

export type GeographicPlaceNameSourceDetail = KitsuResource &
  GeographicPlaceNameSourceDetailAttributes;
