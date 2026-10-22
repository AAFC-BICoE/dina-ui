import { KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";

export interface ObjectSubtypeAttributes {
  type: string;
  uuid: string;
  dcType: string;
  acSubtype: string;
  systemDefined?: boolean;
  multilingualTitle?: MultilingualTitle;
  multilingualDescription?: MultilingualDescription;
  createdBy?: string;
  createdOn?: string;
}

export type ObjectSubtype = KitsuResource & ObjectSubtypeAttributes;
