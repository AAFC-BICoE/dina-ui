import { KitsuResource } from "kitsu";

export interface PreparationTypeAttributes {
  uuid: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export type PreparationType = KitsuResource & PreparationTypeAttributes;
