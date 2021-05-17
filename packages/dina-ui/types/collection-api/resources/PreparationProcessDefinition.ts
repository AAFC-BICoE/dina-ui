import { KitsuResource } from "kitsu";

export interface PreparationProcessDefinitionAttributes {
  uuid: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
  group: string;
}

export type PreparationProcessDefinition = KitsuResource &
  PreparationProcessDefinitionAttributes;
