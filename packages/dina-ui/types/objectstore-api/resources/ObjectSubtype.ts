import { KitsuResource } from "kitsu";

export interface ObjectSubtypeAttributes {
  type: string;
  uuid: string;
  dcType: string;
  acSubtype: string;
  appManaged?: boolean;
}

export type ObjectSubtype = KitsuResource & ObjectSubtypeAttributes;
