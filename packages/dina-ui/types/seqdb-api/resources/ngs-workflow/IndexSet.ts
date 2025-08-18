import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { NgsIndex } from "./NgsIndex";

export interface IndexSetAttributes {
  type: "index-set";
  name: string;
  forwardAdapter?: string;
  reverseAdapter?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface IndexSetRelationships {
  ngsIndexes?: NgsIndex[] | null;
}

export type IndexSet = KitsuResource &
  IndexSetAttributes &
  IndexSetRelationships;

// Response types (what comes from API)
export interface IndexSetResponseAttributes {
  type: "index-set";
  name: string;
  forwardAdapter?: string;
  reverseAdapter?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface IndexSetResponseRelationships {
  ngsIndexes?: {
    data?: PersistedResource<NgsIndex>[];
  };
}

export type IndexSetResponse = KitsuResource &
  IndexSetResponseAttributes &
  IndexSetResponseRelationships;

/**
 * Parses a `PersistedResource<IndexSetResponse>` object and transforms it into a `PersistedResource<IndexSet>`.
 *
 * This function omits specific relationship properties from the input index set and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<IndexSetResponse>`.
 * @returns The parsed index set resource, of type `PersistedResource<IndexSet>`.
 */
export function indexSetParser(
  data: PersistedResource<IndexSetResponse>
): PersistedResource<IndexSet> {
  const parsedIndexSet = baseRelationshipParser(
    ["ngsIndexes"],
    data
  ) as PersistedResource<IndexSet>;

  return parsedIndexSet;
}
