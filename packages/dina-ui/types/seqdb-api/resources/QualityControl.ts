import { KitsuResource } from "kitsu";
import { MolecularAnalysisRunItem } from "./molecular-analysis/MolecularAnalysisRunItem";

export interface QualityControlAttributes {
  type: "quality-control";
  group: string;
  name: string;
  qcType: string;
  createdOn?: string;
  createdBy?: string;
}

export interface QualityControlRelationships {
  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
}

export type QualityControl = KitsuResource &
  QualityControlAttributes &
  QualityControlRelationships;
