import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
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
  protocol?: Protocol | null;
}

export type GenericMolecularAnalysis = KitsuResource &
  GenericMolecularAnalysisAttributes &
  GenericMolecularAnalysisRelationships;

// Response types (what comes from API)
export interface GenericMolecularAnalysisResponseAttributes {
  type: "generic-molecular-analysis";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  analysisType?: string;
  managedAttributes?: ManagedAttributeValues;
}

export interface GenericMolecularAnalysisResponseRelationships {
  protocol?: {
    data?: PersistedResource<Protocol>;
  };
}

export type GenericMolecularAnalysisResponse = KitsuResource &
  GenericMolecularAnalysisResponseAttributes &
  GenericMolecularAnalysisResponseRelationships;

/**
 * Parses a `PersistedResource<GenericMolecularAnalysisResponse>` object and transforms it into a `PersistedResource<GenericMolecularAnalysis>`.
 *
 * This function omits specific relationship properties from the input generic molecular analysis and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<GenericMolecularAnalysisResponse>`.
 * @returns The parsed generic molecular analysis resource, of type `PersistedResource<GenericMolecularAnalysis>`.
 */
export function genericMolecularAnalysisParser(
  data: PersistedResource<GenericMolecularAnalysisResponse>
): PersistedResource<GenericMolecularAnalysis> {
  const parsedGenericMolecularAnalysis = baseRelationshipParser(
    ["protocol"],
    data
  ) as PersistedResource<GenericMolecularAnalysis>;

  return parsedGenericMolecularAnalysis;
}
