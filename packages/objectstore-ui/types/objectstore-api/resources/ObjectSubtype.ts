import { KitsuResource } from "kitsu";

export interface ObjectSubtypeAttributes {
  type: string;
  dcType:
    | "Image"
    | "Moving Image"
    | "Sound"
    | "Text"
    | "Dataset"
    | "Undetermined";
  acSubtype: string;
}

export type ObjectSubtype = KitsuResource & ObjectSubtypeAttributes;
