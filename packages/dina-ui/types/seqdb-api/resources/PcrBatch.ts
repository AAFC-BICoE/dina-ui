import { KitsuResource, PersistedResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { Protocol } from "../../collection-api";
import { Person } from "../../objectstore-api";
import { PcrPrimer } from "./PcrPrimer";
import { Region } from "./Region";

export interface PcrBatchAttributes {
  type: "pcr-batch";
  name: string;
  group?: string;
  isCompleted: boolean;
  batchType?: string;
  createdBy?: string;
  createdOn?: string;

  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: Person[];

  positiveControl?: string;
  reactionVolume?: string;
  reactionDate?: string;
  thermocycler?: string;
  objective?: string;
}

export interface PcrBatchRelationships {
  primerForward?: PcrPrimer | null;
  primerReverse?: PcrPrimer | null;
  region?: Region | null;
  attachment?: ResourceIdentifierObject[] | null;
  storageUnit?: ResourceIdentifierObject | null;
  protocol?: Protocol | null;
}

export type PcrBatch = KitsuResource &
  PcrBatchAttributes &
  PcrBatchRelationships;

// Response types (what comes from API)
export interface PcrBatchResponseAttributes {
  type: "pcr-batch";
  name: string;
  group?: string;
  isCompleted: boolean;
  batchType?: string;
  createdBy?: string;
  createdOn?: string;

  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: Person[];

  positiveControl?: string;
  reactionVolume?: string;
  reactionDate?: string;
  thermocycler?: string;
  objective?: string;
}

export interface PcrBatchResponseRelationships {
  primerForward?: {
    data?: PersistedResource<PcrPrimer>;
  };
  primerReverse?: {
    data?: PersistedResource<PcrPrimer>;
  };
  region?: {
    data?: PersistedResource<Region>;
  };
  attachment?: {
    data?: ResourceIdentifierObject[];
  };
  storageUnit?: {
    data?: ResourceIdentifierObject;
  };
  protocol?: {
    data?: PersistedResource<Protocol>;
  };
}

export type PcrBatchResponse = KitsuResource &
  PcrBatchResponseAttributes &
  PcrBatchResponseRelationships;

/**
 * Parses a `PersistedResource<PcrBatchResponse>` object and transforms it into a `PersistedResource<PcrBatch>`.
 *
 * This function omits specific relationship properties from the input PCR batch and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<PcrBatchResponse>`.
 * @returns The parsed PCR batch resource, of type `PersistedResource<PcrBatch>`.
 */
export function pcrBatchParser(
  data: PersistedResource<PcrBatchResponse>
): PersistedResource<PcrBatch> {
  const parsedPcrBatch = baseRelationshipParser(
    [
      "primerForward",
      "primerReverse",
      "region",
      "attachment",
      "storageUnit",
      "protocol"
    ],
    data
  ) as PersistedResource<PcrBatch>;

  return parsedPcrBatch;
}
