import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { LibraryPool } from "./LibraryPool";
import { LibraryPrepBatch } from "./LibraryPrepBatch";

export interface LibraryPoolContentAttributes {
  type: "library-pool-content";
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPoolContentRelationships {
  libraryPool?: LibraryPool | null;
  pooledLibraryPrepBatch?: LibraryPrepBatch | null;
  pooledLibraryPool?: LibraryPool | null;
}

export type LibraryPoolContent = KitsuResource &
  LibraryPoolContentAttributes &
  LibraryPoolContentRelationships;

// Response types (what comes from API)
export interface LibraryPoolContentResponseAttributes {
  type: "library-pool-content";
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPoolContentResponseRelationships {
  libraryPool?: {
    data?: PersistedResource<LibraryPool>;
  };
  pooledLibraryPrepBatch?: {
    data?: PersistedResource<LibraryPrepBatch>;
  };
  pooledLibraryPool?: {
    data?: PersistedResource<LibraryPool>;
  };
}

export type LibraryPoolContentResponse = KitsuResource &
  LibraryPoolContentResponseAttributes &
  LibraryPoolContentResponseRelationships;

/**
 * Parses a `PersistedResource<LibraryPoolContentResponse>` object and transforms it into a `PersistedResource<LibraryPoolContent>`.
 *
 * This function omits specific relationship properties from the input library pool content and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<LibraryPoolContentResponse>`.
 * @returns The parsed library pool content resource, of type `PersistedResource<LibraryPoolContent>`.
 */
export function libraryPoolContentParser(
  data: PersistedResource<LibraryPoolContentResponse>
): PersistedResource<LibraryPoolContent> {
  const parsedLibraryPoolContent = baseRelationshipParser(
    ["libraryPool", "pooledLibraryPrepBatch", "pooledLibraryPool"],
    data
  ) as PersistedResource<LibraryPoolContent>;

  return parsedLibraryPoolContent;
}
