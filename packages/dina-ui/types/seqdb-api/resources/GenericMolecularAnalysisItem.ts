import { KitsuResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { GenericMolecularAnalysis } from "./GenericMolecularAnalysis";
import { MolecularAnalysisRunItem } from "./MolecularAnalysisRunItem";

export interface GenericMolecularAnalysisItemAttributes {
  type: "generic-molecular-analysis-item";
  createdBy?: string;
  createdOn?: string;
}

export interface GenericMolecularAnalysisItemRelationships {
  materialSample?: ResourceIdentifierObject;
  storageUnitUsage?: ResourceIdentifierObject;
  genericMolecularAnalysis?: GenericMolecularAnalysis;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
}

export type GenericMolecularAnalysisItem = KitsuResource &
  GenericMolecularAnalysisItemAttributes &
  GenericMolecularAnalysisItemRelationships;
