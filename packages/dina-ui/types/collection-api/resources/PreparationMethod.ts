import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface PreparationMethodAttributes {
  type: "preparation-method";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export type PreparationMethod = KitsuResource & PreparationMethodAttributes;
