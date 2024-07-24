import { KitsuResource } from "kitsu";
import { PcrBatchItem } from "./PcrBatchItem";
import { PcrPrimer } from "./PcrPrimer";
import { SeqBatch } from "./SeqBatch";
import { StorageUnitUsage } from "../../collection-api/resources/StorageUnitUsage";

export interface SeqReactionAttributes {
  type: "seq-reaction";
  group?: string;
  wellColumn?: number;
  wellRow?: string;
  cellNumber?: number;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqReactionRelationships {
  seqBatch?: SeqBatch;
  pcrBatchItem?: PcrBatchItem;
  seqPrimer?: PcrPrimer;
  storageUnitUsage?: StorageUnitUsage;
}

export type SeqReaction = KitsuResource &
  SeqReactionAttributes &
  SeqReactionRelationships;
