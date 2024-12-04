import { KitsuResource } from "kitsu";
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
  metagenomicsBatch?: MetagenomicsBatch;
  indexI5?: NgsIndex;
  indexI7?: NgsIndex;
  pcrBatchItem?: PcrBatchItem;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
}

export type MetagenomicsBatchItem = KitsuResource &
  MetagenomicsBatchItemAttributes &
  MetagenomicsBatchItemRelationships;
