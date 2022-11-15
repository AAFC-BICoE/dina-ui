import { KitsuResource } from "kitsu";
import { PcrBatch } from "./PcrBatch";
import { ResourceIdentifierObject } from "jsonapi-typescript";

export const PCR_BATCH_ITEM_RESULT_INFO: {
  option: string;
  color: string;
  labelKey: string;
}[] = [
  {
    option: "No Band",
    color: "FFC0CB",
    labelKey: ""
  },
  {
    option: "Good Band",
    color: "DEFCDE",
    labelKey: ""
  },
  {
    option: "Weak Band",
    color: "FFFACD",
    labelKey: ""
  },
  {
    option: "Multiple Bands",
    color: "EACEDE",
    labelKey: ""
  },
  {
    option: "Contaminated",
    color: "FFC0CB",
    labelKey: ""
  },
  {
    option: "Smear",
    color: "DCDCDC",
    labelKey: ""
  }
];

export interface PcrBatchItemAttributes {
  type: "pcr-batch-item";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  wellRow?: string;
  wellColumn?: number;
  cellNumber?: number;
  result?: string;
}

export interface PcrBatchItemRelationships {
  pcrBatch?: PcrBatch;
  materialSample?: ResourceIdentifierObject;
}

export type PcrBatchItem = KitsuResource &
  PcrBatchItemAttributes &
  PcrBatchItemRelationships;
