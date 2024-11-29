import { KitsuResource } from "kitsu";
import { Protocol } from "../../collection-api";

export interface GenericMolecularAnalysisAttributes {
  type: "generic-molecular-analysis";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  analysisType?: string;
}

export interface GenericMolecularAnalysisRelationships {
  protocol?: Protocol;
}

export type GenericMolecularAnalysis = KitsuResource &
  GenericMolecularAnalysisAttributes &
  GenericMolecularAnalysisRelationships;
