import { KitsuResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { GenericMolecularAnalysis } from "./GenericMolecularAnalysis";
import { StorageUnitUsage } from "../../collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRunItem } from "./molecular-analysis/MolecularAnalysisRunItem";

export interface GenericMolecularAnalysisItemAttributes {
  type: "generic-molecular-analysis-item";
  createdBy?: string;
  createdOn?: string;
}

export interface GenericMolecularAnalysisItemRelationships {
  materialSample?: ResourceIdentifierObject;
  storageUnitUsage?: StorageUnitUsage;
  genericMolecularAnalysis?: GenericMolecularAnalysis;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
}

export type GenericMolecularAnalysisItem = KitsuResource &
  GenericMolecularAnalysisItemAttributes &
  GenericMolecularAnalysisItemRelationships;
