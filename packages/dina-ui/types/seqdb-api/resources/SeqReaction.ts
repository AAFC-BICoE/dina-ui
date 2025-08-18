import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { PcrBatchItem } from "./PcrBatchItem";
import { PcrPrimer } from "./PcrPrimer";
import { SeqBatch } from "./SeqBatch";
import { StorageUnitUsage } from "../../collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRunItem } from "./molecular-analysis/MolecularAnalysisRunItem";

export interface SeqReactionAttributes {
  type: "seq-reaction";
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqReactionRelationships {
  seqBatch?: SeqBatch | null;
  pcrBatchItem?: PcrBatchItem | null;
  seqPrimer?: PcrPrimer | null;
  storageUnitUsage?: StorageUnitUsage | null;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem | null;
}

export type SeqReaction = KitsuResource &
  SeqReactionAttributes &
  SeqReactionRelationships;

// Response types (what comes from API)
export interface SeqReactionResponseAttributes {
  type: "seq-reaction";
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqReactionResponseRelationships {
  seqBatch?: {
    data?: PersistedResource<SeqBatch>;
  };
  pcrBatchItem?: {
    data?: PersistedResource<PcrBatchItem>;
  };
  seqPrimer?: {
    data?: PersistedResource<PcrPrimer>;
  };
  storageUnitUsage?: {
    data?: PersistedResource<StorageUnitUsage>;
  };
  molecularAnalysisRunItem?: {
    data?: PersistedResource<MolecularAnalysisRunItem>;
  };
}

export type SeqReactionResponse = KitsuResource &
  SeqReactionResponseAttributes &
  SeqReactionResponseRelationships;

/**
 * Parses a `PersistedResource<SeqReactionResponse>` object and transforms it into a `PersistedResource<SeqReaction>`.
 *
 * This function omits specific relationship properties from the input sequencing reaction and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<SeqReactionResponse>`.
 * @returns The parsed sequencing reaction resource, of type `PersistedResource<SeqReaction>`.
 */
export function seqReactionParser(
  data: PersistedResource<SeqReactionResponse>
): PersistedResource<SeqReaction> {
  const parsedSeqReaction = baseRelationshipParser(
    [
      "seqBatch",
      "pcrBatchItem",
      "seqPrimer",
      "storageUnitUsage",
      "molecularAnalysisRunItem"
    ],
    data
  ) as PersistedResource<SeqReaction>;

  return parsedSeqReaction;
}
