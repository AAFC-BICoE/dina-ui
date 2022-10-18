import { KitsuResource } from "kitsu";
import { PcrBatch } from "./PcrBatch";
import { ResourceIdentifierObject } from "jsonapi-typescript";

export interface PcrBatchItemAttributes {
  type: "pcr-batch-item";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  wellRow?: string;
  wellColumn?: number;
}

export interface PcrBatchItemRelationships {
  pcrBatch?: PcrBatch;
  materialSample?: ResourceIdentifierObject;
}

export type PcrBatchItem = KitsuResource &
  PcrBatchItemAttributes &
  PcrBatchItemRelationships;
