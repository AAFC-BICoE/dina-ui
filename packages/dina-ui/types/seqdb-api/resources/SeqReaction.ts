import { KitsuResource } from "kitsu";
import { PcrBatchItem } from "./PcrBatchItem";
import { PcrPrimer } from "./PcrPrimer";
import { SeqBatch } from "./SeqBatch";

export interface SeqReactionAttributes {
  type: "seq-reaction";
  group?: string;
  wellColumn?: number;
  wellRow?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqReactionRelationships {
  seqBatch?: SeqBatch;
  pcrBatchItem?: PcrBatchItem;
  seqPrimer?: PcrPrimer;
}

export type SeqReaction = KitsuResource &
  SeqReactionAttributes &
  SeqReactionRelationships;
