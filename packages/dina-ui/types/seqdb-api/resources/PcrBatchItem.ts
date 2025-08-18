import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { PcrBatch } from "./PcrBatch";
import { MaterialSample } from "../../collection-api";
import { StorageUnitUsage } from "../../collection-api/resources/StorageUnitUsage";

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
  result?: string;
}

export interface PcrBatchItemRelationships {
  pcrBatch?: PcrBatch | null;
  materialSample?: MaterialSample | null;
  storageUnitUsage?: StorageUnitUsage | null;
}

export type PcrBatchItem = KitsuResource &
  PcrBatchItemAttributes &
  PcrBatchItemRelationships;

// Response types (what comes from API)
export interface PcrBatchItemResponseAttributes {
  type: "pcr-batch-item";
  createdBy?: string;
  createdOn?: string;
  group?: string;
  result?: string;
}

export interface PcrBatchItemResponseRelationships {
  pcrBatch?: {
    data?: PersistedResource<PcrBatch>;
  };
  materialSample?: {
    data?: PersistedResource<MaterialSample>;
  };
  storageUnitUsage?: {
    data?: PersistedResource<StorageUnitUsage>;
  };
}

export type PcrBatchItemResponse = KitsuResource &
  PcrBatchItemResponseAttributes &
  PcrBatchItemResponseRelationships;

/**
 * Parses a `PersistedResource<PcrBatchItemResponse>` object and transforms it into a `PersistedResource<PcrBatchItem>`.
 *
 * This function omits specific relationship properties from the input PCR batch item and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<PcrBatchItemResponse>`.
 * @returns The parsed PCR batch item resource, of type `PersistedResource<PcrBatchItem>`.
 */
export function pcrBatchItemParser(
  data: PersistedResource<PcrBatchItemResponse>
): PersistedResource<PcrBatchItem> {
  const parsedPcrBatchItem = baseRelationshipParser(
    ["pcrBatch", "materialSample", "storageUnitUsage"],
    data
  ) as PersistedResource<PcrBatchItem>;

  return parsedPcrBatchItem;
}
