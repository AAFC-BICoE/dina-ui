import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { NgsIndex } from "./NgsIndex";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

export interface LibraryPrepAttributes {
  type: "library-prep";
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPrepRelationships {
  libraryPrepBatch?: LibraryPrepBatch | null;
  materialSample?: MaterialSample | null;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
  storageUnitUsage?: StorageUnitUsage | null;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;

// Response types (what comes from API)
export interface LibraryPrepResponseAttributes {
  type: "library-prep";
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface LibraryPrepResponseRelationships {
  libraryPrepBatch?: {
    data?: PersistedResource<LibraryPrepBatch>;
  };
  materialSample?: {
    data?: PersistedResource<MaterialSample>;
  };
  indexI5?: {
    data?: PersistedResource<NgsIndex>;
  };
  indexI7?: {
    data?: PersistedResource<NgsIndex>;
  };
  storageUnitUsage?: {
    data?: PersistedResource<StorageUnitUsage>;
  };
}

export type LibraryPrepResponse = KitsuResource &
  LibraryPrepResponseAttributes &
  LibraryPrepResponseRelationships;

/**
 * Parses a `PersistedResource<LibraryPrepResponse>` object and transforms it into a `PersistedResource<LibraryPrep>`.
 *
 * This function omits specific relationship properties from the input library prep and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<LibraryPrepResponse>`.
 * @returns The parsed library prep resource, of type `PersistedResource<LibraryPrep>`.
 */
export function libraryPrepParser(
  data: PersistedResource<LibraryPrepResponse>
): PersistedResource<LibraryPrep> {
  const parsedLibraryPrep = baseRelationshipParser(
    [
      "libraryPrepBatch",
      "materialSample",
      "indexI5",
      "indexI7",
      "storageUnitUsage"
    ],
    data
  ) as PersistedResource<LibraryPrep>;

  return parsedLibraryPrep;
}
