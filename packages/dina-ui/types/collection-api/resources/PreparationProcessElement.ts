import { KitsuResource } from "kitsu";
import { MaterialSample } from "./MaterialSample";
import { PreparationProcess } from "./PreparationProcess";

export interface PreparationProcessElementAttributes {
  uuid: string;
  createdOn: string;
  createdBy: string;
}

export interface PreparationProcessElementRelationship {
  preparationProcess: PreparationProcess;
  materialSample: MaterialSample;
}

export type PreparationProcessElement = KitsuResource &
  PreparationProcessElementAttributes &
  PreparationProcessElementRelationship;
