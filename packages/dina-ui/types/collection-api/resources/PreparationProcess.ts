import { KitsuResource } from "kitsu";
import { MaterialSample } from "./MaterialSample";
import { PreparationProcessDefinition } from "./PreparationProcessDefinition";

export interface PreparationProcessAttributes {
  uuid?: string;
  name?: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
}

export interface PreparationProcessRelationships {
  preparationProcessDefinition?: PreparationProcessDefinition;
  sourceMaterialSample?: MaterialSample;
}

export type PreparationProcess = KitsuResource &
  PreparationProcessAttributes &
  PreparationProcessRelationships;
