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

/**
 * Using the enums above, a hex code color is returned to display in the dropdown menu.
 * @param result The result enum to get the color against.
 * @returns string of the hex code color. Without the # prepended.
 */
export function pcrBatchItemResultColor(result: any) {
  switch (result) {
    case PcrBatchItemDropdownResults.NO_BAND:
      return "FFC0CB";
    case PcrBatchItemDropdownResults.GOOD_BAND:
      return "DEFCDE";
    case PcrBatchItemDropdownResults.WEAK_BAND:
      return "FFFACD";
    case PcrBatchItemDropdownResults.MULTIPLE_BANDS:
      return "EACEDE";
    case PcrBatchItemDropdownResults.CONTAMINATED:
      return "FFC0CB";
    case PcrBatchItemDropdownResults.SMEAR:
      return "DCDCDC";
    default:
      return "92A8D1";
  }
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
