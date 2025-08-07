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

export function metagenomicsBatchItemParser(data) {
  data.metagenomicsBatch = data.metagenomicsBatch?.data;
  data.indexI5 = data.indexI5?.data;
  data.indexI7 = data.indexI7?.data;
  data.pcrBatchItem = data.pcrBatchItem?.data;
  data.molecularAnalysisRunItem = data.molecularAnalysisRunItem?.data;

  return data;
}
