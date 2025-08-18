import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { LibraryPoolContent } from "./LibraryPoolContent";

export interface LibraryPoolAttributes {
  type: "library-pool";
  name: string;
  dateUsed?: string;
  notes?: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPoolRelationships {
  contents?: LibraryPoolContent[] | null;
}

export type LibraryPool = KitsuResource &
  LibraryPoolAttributes &
  LibraryPoolRelationships;

// Response types (what comes from API)
export interface LibraryPoolResponseAttributes {
  type: "library-pool";
  name: string;
  dateUsed?: string;
  notes?: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPoolResponseRelationships {
  contents?: {
    data?: PersistedResource<LibraryPoolContent>[];
  };
}

export type LibraryPoolResponse = KitsuResource &
  LibraryPoolResponseAttributes &
  LibraryPoolResponseRelationships;

/**
 * Parses a `PersistedResource<LibraryPoolResponse>` object and transforms it into a `PersistedResource<LibraryPool>`.
 *
 * This function omits specific relationship properties from the input library pool and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<LibraryPoolResponse>`.
 * @returns The parsed library pool resource, of type `PersistedResource<LibraryPool>`.
 */
export function libraryPoolParser(
  data: PersistedResource<LibraryPoolResponse>
): PersistedResource<LibraryPool> {
  const parsedLibraryPool = baseRelationshipParser(
    ["contents"],
    data
  ) as PersistedResource<LibraryPool>;

  return parsedLibraryPool;
}
