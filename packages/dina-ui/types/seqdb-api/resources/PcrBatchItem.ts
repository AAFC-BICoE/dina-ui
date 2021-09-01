import { KitsuResource } from "kitsu";
import { MolecularSample } from "./MolecularSample";
import { PcrBatch } from "./PcrBatch";

export interface PcrBatchItemAttributes {
  type: "pcr-batch-item";
  createdBy?: string;
  createdOn?: string;
  group?: string;
}

export interface PcrBatchItemRelationships {
  pcrBatch?: PcrBatch;
  sample?: MolecularSample;
}

export type PcrBatchItem = KitsuResource &
  PcrBatchItemAttributes &
  PcrBatchItemRelationships;
