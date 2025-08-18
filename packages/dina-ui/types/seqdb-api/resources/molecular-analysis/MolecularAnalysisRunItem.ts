import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { MolecularAnalysisRun } from "./MolecularAnalysisRun";
import { MolecularAnalysisResult } from "./MolecularAnalysisResult";

// Common usage types.
export enum MolecularAnalysisRunItemUsageType {
  GENERIC_MOLECULAR_ANALYSIS_ITEM = "generic-molecular-analysis-item",
  QUALITY_CONTROL = "quality-control",
  SEQ_REACTION = "seq-reaction",
  METAGENOMICS_BATCH_ITEM = "metagenomics-batch-item"
}

export interface MolecularAnalysisRunItemAttributes {
  type: "molecular-analysis-run-item";
  createdBy?: string;
  createdOn?: string;
  usageType: string;
  name?: string;
}

export interface MolecularAnalysisRunItemRelationships {
  run?: MolecularAnalysisRun | null;
  result?: MolecularAnalysisResult | null;
}

export type MolecularAnalysisRunItem = KitsuResource &
  MolecularAnalysisRunItemAttributes &
  MolecularAnalysisRunItemRelationships;

// Response types (what comes from API)
export interface MolecularAnalysisRunItemResponseAttributes {
  type: "molecular-analysis-run-item";
  createdBy?: string;
  createdOn?: string;
  usageType: string;
  name?: string;
}

export interface MolecularAnalysisRunItemResponseRelationships {
  run?: {
    data?: PersistedResource<MolecularAnalysisRun>;
  };
  result?: {
    data?: PersistedResource<MolecularAnalysisResult>;
  };
}

export type MolecularAnalysisRunItemResponse = KitsuResource &
  MolecularAnalysisRunItemResponseAttributes &
  MolecularAnalysisRunItemResponseRelationships;

/**
 * Parses a `PersistedResource<MolecularAnalysisRunItemResponse>` object and transforms it into a `PersistedResource<MolecularAnalysisRunItem>`.
 *
 * This function omits specific relationship properties from the input molecular analysis run item and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MolecularAnalysisRunItemResponse>`.
 * @returns The parsed molecular analysis run item resource, of type `PersistedResource<MolecularAnalysisRunItem>`.
 */
export function molecularAnalysisRunItemParser(
  data: PersistedResource<MolecularAnalysisRunItemResponse>
): PersistedResource<MolecularAnalysisRunItem> {
  const parsedMolecularAnalysisRunItem = baseRelationshipParser(
    ["run", "result"],
    data
  ) as PersistedResource<MolecularAnalysisRunItem>;

  return parsedMolecularAnalysisRunItem;
}
