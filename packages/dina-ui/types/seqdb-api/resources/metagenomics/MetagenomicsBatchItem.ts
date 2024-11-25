import { KitsuResource } from "kitsu";
import { NgsIndex } from "../ngs-workflow/NgsIndex";

export interface MetagenomicsBatchItemAttributes {
  type: "metagenomics-batch-item";
  createdBy?: string;
  createdOn?: string;
}

export interface MetagenomicsBatchRelationships {
  metagenomicsBatch?: MetagenomicsBatch;
  indexI5?: NgsIndex;
  indexI7?: NgsIndex;
}

export type MetagenomicsBatch = KitsuResource &
  MetagenomicsBatchItemAttributes &
  MetagenomicsBatchRelationships;
