import { KitsuResource } from "kitsu";
import { MolecularAnalysisRun } from "./MolecularAnalysisRun";
import { MolecularAnalysisResult } from "./MolecularAnalysisResult";

// Common usage types.
export enum MolecularAnalysisRunItemUsageType {
  GENERIC_MOLECULAR_ANALYSIS_ITEM = "generic-molecular-analysis-item",
  QUALITY_CONTROL = "quality-control",
  SEQ_REACTION = "seq-reaction",
  METAGENOMICS_BATCH_ITEM = "metagenomics-batch-item"
}

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
