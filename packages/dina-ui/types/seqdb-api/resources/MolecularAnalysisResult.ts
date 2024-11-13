import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";

export interface MolecularAnalysisResultAttributes {
  type: "molecular-analysis-result";
  createdBy?: string;
  createdOn?: string;
}

export interface MolecularAnalysisResultRelationships {
  attachments?: ResourceIdentifierObject[];
}

export type MolecularAnalysisResult = KitsuResource &
  MolecularAnalysisResultAttributes &
  MolecularAnalysisResultRelationships;
