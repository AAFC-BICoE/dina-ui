import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { LibraryPrep, Product } from "../..";

export type PreLibraryPrepType = "SHEARING" | "SIZE_SELECTION";

export interface PreLibraryPrepAttributes {
  type: "pre-library-prep";
  createdBy?: string;
  createdOn?: string;
  preLibraryPrepType: PreLibraryPrepType;
  inputAmount?: number;
  targetBpSize?: number;
  averageFragmentSize?: number;
  concentration?: number;
  quality?: string;
  notes?: string;
  group?: string;
}

export interface PreLibraryPrepRelationships {
  libraryPrep?: LibraryPrep | null;
  protocol?: Protocol | null;
  product?: Product | null;
}

export type PreLibraryPrep = KitsuResource &
  PreLibraryPrepAttributes &
  PreLibraryPrepRelationships;

// Response types (what comes from API)
export interface PreLibraryPrepResponseAttributes {
  type: "pre-library-prep";
  createdBy?: string;
  createdOn?: string;
  preLibraryPrepType: PreLibraryPrepType;
  inputAmount?: number;
  targetBpSize?: number;
  averageFragmentSize?: number;
  concentration?: number;
  quality?: string;
  notes?: string;
  group?: string;
}

export interface PreLibraryPrepResponseRelationships {
  libraryPrep?: {
    data?: PersistedResource<LibraryPrep>;
  };
  protocol?: {
    data?: PersistedResource<Protocol>;
  };
  product?: {
    data?: PersistedResource<Product>;
  };
}

export type PreLibraryPrepResponse = KitsuResource &
  PreLibraryPrepResponseAttributes &
  PreLibraryPrepResponseRelationships;

/**
 * Parses a `PersistedResource<PreLibraryPrepResponse>` object and transforms it into a `PersistedResource<PreLibraryPrep>`.
 *
 * This function omits specific relationship properties from the input pre-library prep and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<PreLibraryPrepResponse>`.
 * @returns The parsed pre-library prep resource, of type `PersistedResource<PreLibraryPrep>`.
 */
export function preLibraryPrepParser(
  data: PersistedResource<PreLibraryPrepResponse>
): PersistedResource<PreLibraryPrep> {
  const parsedPreLibraryPrep = baseRelationshipParser(
    ["libraryPrep", "protocol", "product"],
    data
  ) as PersistedResource<PreLibraryPrep>;

  return parsedPreLibraryPrep;
}
