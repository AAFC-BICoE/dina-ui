import { KitsuResource } from "kitsu";

export interface MultilingualDescription {
  descriptions?: MultilingualPair[] | null;
}

export interface MultilingualPair {
  lang?: string | null;
  desc?: string | null;
}

export interface PreparationTypeAttributes {
  type: "preparation-type";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export type PreparationType = KitsuResource & PreparationTypeAttributes;
