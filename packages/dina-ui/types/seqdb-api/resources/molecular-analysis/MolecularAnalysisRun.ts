import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";

export interface MolecularAnalysisRunAttributes {
  type: "molecular-analysis-run";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  name?: string;
}

export interface MolecularAnalysisRunRelationships {
  attachments?: ResourceIdentifierObject[];
}

export type MolecularAnalysisRun = KitsuResource &
  MolecularAnalysisRunAttributes &
  MolecularAnalysisRunRelationships;
