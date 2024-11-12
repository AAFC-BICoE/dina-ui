import { KitsuResource } from "kitsu";
import { Metadata } from "../../../objectstore-api/resources/Metadata";

export interface MolecularAnalysisResultAttributes {
  type: "molecular-analysis-result";
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface MolecularAnalysisResultRelationships {
  attachments: Metadata[];
}

export type MolecularAnalysisResult = KitsuResource &
  MolecularAnalysisResultAttributes &
  MolecularAnalysisResultRelationships;
