import { KitsuResource } from "kitsu";

export interface MolecularAnalysisRunAttributes {
  type: "molecular-analysis-run";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  name?: string;
}

export type MolecularAnalysisRun = KitsuResource &
  MolecularAnalysisRunAttributes;
