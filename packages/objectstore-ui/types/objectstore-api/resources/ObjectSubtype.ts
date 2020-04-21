import { KitsuResource } from "kitsu";

export interface ObjectSubtypeAttributes {
  type: string;
  uuid: string;
  dcType: string;
  acSubtype: string;
}

export type ObjectSubtype = KitsuResource & ObjectSubtypeAttributes;
