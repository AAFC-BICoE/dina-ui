import { KitsuResource } from "kitsu";
import { MolecularAnalysisRun } from "./MolecularAnalysisRun";
import { MolecularAnalysisResult } from "./MolecularAnalysisResult";

export interface MolecularAnalysisRunItemAttributes {
  type: "molecular-analysis-run-item";
  createdBy?: string;
  createdOn?: string;
  usageType: string;
  name?: string;
}

export interface MolecularAnalysisRunItemRelationships {
  run?: MolecularAnalysisRun;
  result?: MolecularAnalysisResult;
}

export type MolecularAnalysisRunItem = KitsuResource &
  MolecularAnalysisRunItemAttributes &
  MolecularAnalysisRunItemRelationships;
