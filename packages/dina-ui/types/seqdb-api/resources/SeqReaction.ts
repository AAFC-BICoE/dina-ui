import { KitsuResource } from "kitsu";
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
  seqBatch?: SeqBatch;
  pcrBatchItem?: PcrBatchItem;
  seqPrimer?: PcrPrimer;
  storageUnitUsage?: StorageUnitUsage;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
}

export type SeqReaction = KitsuResource &
  SeqReactionAttributes &
  SeqReactionRelationships;
