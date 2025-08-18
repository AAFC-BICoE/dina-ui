import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { IndexSet } from "../ngs-workflow/IndexSet";
import { Protocol } from "../../../collection-api";

export interface MetagenomicsBatchAttributes {
  type: "metagenomics-batch";
  name: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface MetagenomicsBatchRelationships {
  protocol?: Protocol | null;
  indexSet?: IndexSet | null;
}

export type MetagenomicsBatch = KitsuResource &
  MetagenomicsBatchAttributes &
  MetagenomicsBatchRelationships;

// Response types (what comes from API)
export interface MetagenomicsBatchResponseAttributes {
  type: "metagenomics-batch";
  name: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface MetagenomicsBatchResponseRelationships {
  protocol?: {
    data?: PersistedResource<Protocol>;
  };
  indexSet?: {
    data?: PersistedResource<IndexSet>;
  };
}

export type MetagenomicsBatchResponse = KitsuResource &
  MetagenomicsBatchResponseAttributes &
  MetagenomicsBatchResponseRelationships;

/**
 * Parses a `PersistedResource<MetagenomicsBatchResponse>` object and transforms it into a `PersistedResource<MetagenomicsBatch>`.
 *
 * This function omits specific relationship properties from the input metagenomics batch and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<MetagenomicsBatchResponse>`.
 * @returns The parsed metagenomics batch resource, of type `PersistedResource<MetagenomicsBatch>`.
 */
export function metagenomicsBatchParser(
  data: PersistedResource<MetagenomicsBatchResponse>
): PersistedResource<MetagenomicsBatch> {
  const parsedMetagenomicsBatch = baseRelationshipParser(
    ["protocol", "indexSet"],
    data
  ) as PersistedResource<MetagenomicsBatch>;

  return parsedMetagenomicsBatch;
}
