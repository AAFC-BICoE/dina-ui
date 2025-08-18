import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { Metadata } from "../../../objectstore-api/resources/Metadata";

export interface MolecularAnalysisResultAttributes {
  type: "molecular-analysis-result";
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface MolecularAnalysisResultRelationships {
  attachments?: Metadata[] | null;
}

export type MolecularAnalysisResult = KitsuResource &
  MolecularAnalysisResultAttributes &
  MolecularAnalysisResultRelationships;

// Response types (what comes from API)
export interface MolecularAnalysisResultResponseAttributes {
  type: "molecular-analysis-result";
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface MolecularAnalysisResultResponseRelationships {
  attachments?: {
    data?: PersistedResource<Metadata>[];
  };
}

export type MolecularAnalysisResultResponse = KitsuResource &
  MolecularAnalysisResultResponseAttributes &
  MolecularAnalysisResultResponseRelationships;

/**
 * Parses a `PersistedResource<MolecularAnalysisResultResponse>` object and transforms it into a `PersistedResource<MolecularAnalysisResult>`.
 *
 * This function omits specific relationship properties from the input molecular analysis result and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MolecularAnalysisResultResponse>`.
 * @returns The parsed molecular analysis result resource, of type `PersistedResource<MolecularAnalysisResult>`.
 */
export function molecularAnalysisResultParser(
  data: PersistedResource<MolecularAnalysisResultResponse>
): PersistedResource<MolecularAnalysisResult> {
  const parsedMolecularAnalysisResult = baseRelationshipParser(
    ["attachments"],
    data
  ) as PersistedResource<MolecularAnalysisResult>;

  return parsedMolecularAnalysisResult;
}
