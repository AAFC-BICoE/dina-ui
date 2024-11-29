import { KitsuResource } from "kitsu";

export interface MolecularAnalysisRunAttributes {
  type: "molecular-analysis-run";
  name?: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export type MolecularAnalysisRun = KitsuResource &
  MolecularAnalysisRunAttributes;
