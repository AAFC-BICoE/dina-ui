import { KitsuResource } from "kitsu";
import { PcrBatch } from "./PcrBatch";
import { ResourceIdentifierObject } from "jsonapi-typescript";

/**
 * The result for the PcrBatch item can be any string provided by the user. The enums below is
 * a list of commonly used results which will be provided in the dropdown menu as suggestions.
 */
export enum PcrBatchItemDropdownResults {
  NO_BAND = "No Band",
  GOOD_BAND = "Good Band",
  WEAK_BAND = "Weak Band",
  MULTIPLE_BANDS = "Multiple Bands",
  CONTAMINATED = "Contaminated",
  SMEAR = "Smear"
}

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
