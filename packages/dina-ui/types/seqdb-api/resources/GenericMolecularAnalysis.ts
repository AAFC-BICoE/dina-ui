import { KitsuResource } from "kitsu";
import { ManagedAttributeValues, Protocol } from "../../collection-api";

export interface GenericMolecularAnalysisAttributes {
  type: "generic-molecular-analysis";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  analysisType?: string;
  managedAttributes?: ManagedAttributeValues;
}

export interface GenericMolecularAnalysisRelationships {
  protocol?: Protocol;
}

export type GenericMolecularAnalysis = KitsuResource &
  GenericMolecularAnalysisAttributes &
  GenericMolecularAnalysisRelationships;
