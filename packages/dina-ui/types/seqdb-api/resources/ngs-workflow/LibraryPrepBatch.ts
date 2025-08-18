import { KitsuResource, PersistedResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { Product } from "../Product";
import { ThermocyclerProfile } from "../ThermocyclerProfile";
import { IndexSet } from "./IndexSet";
import { LibraryPrep } from "./LibraryPrep";

export interface LibraryPrepBatchAttributes {
  type: "library-prep-batch";
  name: string;
  group?: string;
  totalLibraryYieldNm?: number;
  notes?: string;
  cleanUpNotes?: string;
  yieldNotes?: string;
  dateUsed?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPrepBatchRelationships {
  product?: Product | null;
  protocol?: Protocol | null;
  indexSet?: IndexSet | null;
  thermocyclerProfile?: ThermocyclerProfile | null;
  libraryPreps?: LibraryPrep[] | null;
  storageUnit?: ResourceIdentifierObject | null;
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;

// Response types (what comes from API)
export interface LibraryPrepBatchResponseAttributes {
  type: "library-prep-batch";
  name: string;
  group?: string;
  totalLibraryYieldNm?: number;
  notes?: string;
  cleanUpNotes?: string;
  yieldNotes?: string;
  dateUsed?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPrepBatchResponseRelationships {
  product?: {
    data?: PersistedResource<Product>;
  };
  protocol?: {
    data?: PersistedResource<Protocol>;
  };
  indexSet?: {
    data?: PersistedResource<IndexSet>;
  };
  thermocyclerProfile?: {
    data?: PersistedResource<ThermocyclerProfile>;
  };
  libraryPreps?: {
    data?: PersistedResource<LibraryPrep>[];
  };
  storageUnit?: {
    data?: ResourceIdentifierObject;
  };
}

export type LibraryPrepBatchResponse = KitsuResource &
  LibraryPrepBatchResponseAttributes &
  LibraryPrepBatchResponseRelationships;

/**
 * Parses a `PersistedResource<LibraryPrepBatchResponse>` object and transforms it into a `PersistedResource<LibraryPrepBatch>`.
 *
 * This function omits specific relationship properties from the input library prep batch and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<LibraryPrepBatchResponse>`.
 * @returns The parsed library prep batch resource, of type `PersistedResource<LibraryPrepBatch>`.
 */
export function libraryPrepBatchParser(
  data: PersistedResource<LibraryPrepBatchResponse>
): PersistedResource<LibraryPrepBatch> {
  const parsedLibraryPrepBatch = baseRelationshipParser(
    [
      "product",
      "protocol",
      "indexSet",
      "thermocyclerProfile",
      "libraryPreps",
      "storageUnit"
    ],
    data
  ) as PersistedResource<LibraryPrepBatch>;

  return parsedLibraryPrepBatch;
}
