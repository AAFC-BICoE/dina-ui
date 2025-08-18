import { KitsuResource, PersistedResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { baseRelationshipParser } from "../../../baseRelationshipParser";

export interface MolecularAnalysisRunAttributes {
  type: "molecular-analysis-run";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  name?: string;
}

export interface MolecularAnalysisRunRelationships {
  attachments?: ResourceIdentifierObject[] | null;
}

export type MolecularAnalysisRun = KitsuResource &
  MolecularAnalysisRunAttributes &
  MolecularAnalysisRunRelationships;

// Response types (what comes from API)
export interface MolecularAnalysisRunResponseAttributes {
  type: "molecular-analysis-run";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  name?: string;
}

export interface MolecularAnalysisRunResponseRelationships {
  attachments?: {
    data?: ResourceIdentifierObject[];
  };
}

export type MolecularAnalysisRunResponse = KitsuResource &
  MolecularAnalysisRunResponseAttributes &
  MolecularAnalysisRunResponseRelationships;

/**
 * Parses a `PersistedResource<MolecularAnalysisRunResponse>` object and transforms it into a `PersistedResource<MolecularAnalysisRun>`.
 *
 * This function omits specific relationship properties from the input molecular analysis run and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MolecularAnalysisRunResponse>`.
 * @returns The parsed molecular analysis run resource, of type `PersistedResource<MolecularAnalysisRun>`.
 */
export function molecularAnalysisRunParser(
  data: PersistedResource<MolecularAnalysisRunResponse>
): PersistedResource<MolecularAnalysisRun> {
  const parsedMolecularAnalysisRun = baseRelationshipParser(
    ["attachments"],
    data
  ) as PersistedResource<MolecularAnalysisRun>;

  return parsedMolecularAnalysisRun;
}
