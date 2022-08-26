import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface PreparationTypeAttributes {
  type: "preparation-type";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export type PreparationType = KitsuResource & PreparationTypeAttributes;
