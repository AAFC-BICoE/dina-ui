import { KitsuResource } from "kitsu";

export interface PreparationTypeAttributes {
  type: "preparation-type";
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export type PreparationType = KitsuResource & PreparationTypeAttributes;
