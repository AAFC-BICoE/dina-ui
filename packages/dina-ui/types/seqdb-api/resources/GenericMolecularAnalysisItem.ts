import { KitsuResource, PersistedResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { GenericMolecularAnalysis } from "./GenericMolecularAnalysis";
import { StorageUnitUsage } from "../../collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRunItem } from "./molecular-analysis/MolecularAnalysisRunItem";

export interface GenericMolecularAnalysisItemAttributes {
  type: "generic-molecular-analysis-item";
  createdBy?: string;
  createdOn?: string;
}

export interface GenericMolecularAnalysisItemRelationships {
  materialSample?: ResourceIdentifierObject | null;
  storageUnitUsage?: StorageUnitUsage | null;
  genericMolecularAnalysis?: GenericMolecularAnalysis | null;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem | null;
}

export type GenericMolecularAnalysisItem = KitsuResource &
  GenericMolecularAnalysisItemAttributes &
  GenericMolecularAnalysisItemRelationships;

// Response types (what comes from API)
export interface GenericMolecularAnalysisItemResponseAttributes {
  type: "generic-molecular-analysis-item";
  createdBy?: string;
  createdOn?: string;
}

export interface GenericMolecularAnalysisItemResponseRelationships {
  materialSample?: {
    data?: ResourceIdentifierObject;
  };
  storageUnitUsage?: {
    data?: PersistedResource<StorageUnitUsage>;
  };
  genericMolecularAnalysis?: {
    data?: PersistedResource<GenericMolecularAnalysis>;
  };
  molecularAnalysisRunItem?: {
    data?: PersistedResource<MolecularAnalysisRunItem>;
  };
}

export type GenericMolecularAnalysisItemResponse = KitsuResource &
  GenericMolecularAnalysisItemResponseAttributes &
  GenericMolecularAnalysisItemResponseRelationships;

/**
 * Parses a `PersistedResource<GenericMolecularAnalysisItemResponse>` object and transforms it into a `PersistedResource<GenericMolecularAnalysisItem>`.
 *
 * This function omits specific relationship properties from the input generic molecular analysis item and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<GenericMolecularAnalysisItemResponse>`.
 * @returns The parsed generic molecular analysis item resource, of type `PersistedResource<GenericMolecularAnalysisItem>`.
 */
export function genericMolecularAnalysisItemParser(
  data: PersistedResource<GenericMolecularAnalysisItemResponse>
): PersistedResource<GenericMolecularAnalysisItem> {
  const parsedGenericMolecularAnalysisItem = baseRelationshipParser(
    [
      "materialSample",
      "storageUnitUsage",
      "genericMolecularAnalysis",
      "molecularAnalysisRunItem"
    ],
    data
  ) as PersistedResource<GenericMolecularAnalysisItem>;

  return parsedGenericMolecularAnalysisItem;
}
