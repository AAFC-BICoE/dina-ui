import { KitsuResource } from "kitsu";
import { MaterialSample } from "./MaterialSample";
import { MaterialSampleFormViewConfig } from "./PreparationProcessDefinition";

export interface PreparationProcessAttributes {
  uuid?: string;
  name?: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
}

export interface PreparationProcessRelationships {
  preparationProcessDefinition?: MaterialSampleFormViewConfig;
  sourceMaterialSample?: MaterialSample;
}

export type PreparationProcess = KitsuResource &
  PreparationProcessAttributes &
  PreparationProcessRelationships;
