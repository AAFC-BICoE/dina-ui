import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { NgsIndex } from "../ngs-workflow/NgsIndex";
import { MetagenomicsBatch } from "./MetagenomicsBatch";
import { PcrBatchItem } from "../PcrBatchItem";
import { MolecularAnalysisRunItem } from "../molecular-analysis/MolecularAnalysisRunItem";

export interface MetagenomicsBatchItemAttributes {
  type: "metagenomics-batch-item";
  createdBy?: string;
  createdOn?: string;
}

export interface MetagenomicsBatchItemRelationships {
  metagenomicsBatch?: MetagenomicsBatch | null;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
  pcrBatchItem?: PcrBatchItem | null;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem | null;
}

export type MetagenomicsBatchItem = KitsuResource &
  MetagenomicsBatchItemAttributes &
  MetagenomicsBatchItemRelationships;

// Response types (what comes from API)
export interface MetagenomicsBatchItemResponseAttributes {
  type: "metagenomics-batch-item";
  createdBy?: string;
  createdOn?: string;
}

export interface MetagenomicsBatchItemResponseRelationships {
  metagenomicsBatch?: {
    data?: PersistedResource<MetagenomicsBatch>;
  };
  indexI5?: {
    data?: PersistedResource<NgsIndex>;
  };
  indexI7?: {
    data?: PersistedResource<NgsIndex>;
  };
  pcrBatchItem?: {
    data?: PersistedResource<PcrBatchItem>;
  };
  molecularAnalysisRunItem?: {
    data?: PersistedResource<MolecularAnalysisRunItem>;
  };
}

export type MetagenomicsBatchItemResponse = KitsuResource &
  MetagenomicsBatchItemResponseAttributes &
  MetagenomicsBatchItemResponseRelationships;

/**
 * Parses a `PersistedResource<MetagenomicsBatchItemResponse>` object and transforms it into a `PersistedResource<MetagenomicsBatchItem>`.
 *
 * This function omits specific relationship properties from the input metagenomics batch item and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MetagenomicsBatchItemResponse>`.
 * @returns The parsed metagenomics batch item resource, of type `PersistedResource<MetagenomicsBatchItem>`.
 */
export function metagenomicsBatchItemParser(
  data: PersistedResource<MetagenomicsBatchItemResponse>
): PersistedResource<MetagenomicsBatchItem> {
  const parsedMetagenomicsBatchItem = baseRelationshipParser(
    [
      "metagenomicsBatch",
      "indexI5",
      "indexI7",
      "pcrBatchItem",
      "molecularAnalysisRunItem"
    ],
    data
  ) as PersistedResource<MetagenomicsBatchItem>;

  return parsedMetagenomicsBatchItem;
}
