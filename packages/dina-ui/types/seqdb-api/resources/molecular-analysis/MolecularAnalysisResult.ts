import { KitsuResource } from "kitsu";
import { Metadata } from "../../../objectstore-api/resources/Metadata";

export interface TabularResults {
  records: Record<string, string | number | boolean>[];
}

export interface MolecularAnalysisResultAttributes {
  type: "molecular-analysis-result";
  group?: string;
  createdBy?: string;
  createdOn?: string;
  tabularResults?: TabularResults | null;
}

export interface MolecularAnalysisResultRelationships {
  attachments: Metadata[];
}

export type MolecularAnalysisResult = KitsuResource &
  MolecularAnalysisResultAttributes &
  MolecularAnalysisResultRelationships;
