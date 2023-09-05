import { KitsuResource } from "kitsu";
import { LibraryPool } from "./LibraryPool";
import { LibraryPrepBatch } from "./LibraryPrepBatch";

interface LibraryPoolContentAttributes {
  type: "library-pool-content";
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPoolContentRelationships {
  libraryPool: LibraryPool;
  pooledLibraryPrepBatch?: LibraryPrepBatch | null;
  pooledLibraryPool?: LibraryPool | null;
}

export type LibraryPoolContent = KitsuResource &
  LibraryPoolContentAttributes &
  LibraryPoolContentRelationships;
