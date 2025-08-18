import { KitsuResource, PersistedResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { Protocol } from "../../collection-api";
import { Person } from "../../objectstore-api";
import { Region } from "./Region";
import { ThermocyclerProfile } from "./ThermocyclerProfile";

export interface SeqBatchAttributes {
  type: "seq-batch";
  name: string;
  group?: string;
  isCompleted: boolean;
  sequencingType?: string;
  reactionDate?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqBatchRelationships {
  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: Person[] | null;
  region?: Region | null;
  thermocyclerProfile?: ThermocyclerProfile | null;
  protocol?: Protocol | null;
  storageUnit?: ResourceIdentifierObject | null;
}

export type SeqBatch = KitsuResource &
  SeqBatchAttributes &
  SeqBatchRelationships;

// Response types (what comes from API)
export interface SeqBatchResponseAttributes {
  type: "seq-batch";
  name: string;
  group?: string;
  isCompleted: boolean;
  sequencingType?: string;
  reactionDate?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqBatchResponseRelationships {
  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: {
    data?: PersistedResource<Person>[];
  };
  region?: {
    data?: PersistedResource<Region>;
  };
  thermocyclerProfile?: {
    data?: PersistedResource<ThermocyclerProfile>;
  };
  protocol?: {
    data?: PersistedResource<Protocol>;
  };
  storageUnit?: {
    data?: ResourceIdentifierObject;
  };
}

export type SeqBatchResponse = KitsuResource &
  SeqBatchResponseAttributes &
  SeqBatchResponseRelationships;

/**
 * Parses a `PersistedResource<SeqBatchResponse>` object and transforms it into a `PersistedResource<SeqBatch>`.
 *
 * This function omits specific relationship properties from the input sequencing batch and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<SeqBatchResponse>`.
 * @returns The parsed sequencing batch resource, of type `PersistedResource<SeqBatch>`.
 */
export function seqBatchParser(
  data: PersistedResource<SeqBatchResponse>
): PersistedResource<SeqBatch> {
  const parsedSeqBatch = baseRelationshipParser(
    [
      "experimenters",
      "region",
      "thermocyclerProfile",
      "protocol",
      "storageUnit"
    ],
    data
  ) as PersistedResource<SeqBatch>;

  return parsedSeqBatch;
}
