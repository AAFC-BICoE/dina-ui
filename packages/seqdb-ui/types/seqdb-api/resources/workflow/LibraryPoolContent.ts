import { KitsuResource } from "kitsu";
import { LibraryPool } from "./LibraryPool";
import { LibraryPrepBatch } from "./LibraryPrepBatch";

interface LibraryPoolContentAttributes {
  type: "libraryPoolContent";
}

interface LibraryPoolContentRelationships {
  libraryPool: LibraryPool;
  pooledLibraryPrepBatch?: LibraryPrepBatch;
  pooledLibraryPool?: LibraryPool;
}

export type LibraryPoolContent = KitsuResource &
  LibraryPoolContentAttributes &
  LibraryPoolContentRelationships;
