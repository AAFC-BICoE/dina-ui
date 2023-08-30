import { KitsuResource } from "kitsu";
import { LibraryPool2 } from "./LibraryPool2";
import { LibraryPrepBatch2 } from "./LibraryPrepBatch2";

interface LibraryPoolContentAttributes {
  type: "library-pool-content";
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPoolContentRelationships {
  libraryPool: LibraryPool2;
  pooledLibraryPrepBatch?: LibraryPrepBatch2 | null;
  pooledLibraryPool?: LibraryPool2 | null;
}

export type LibraryPoolContent2 = KitsuResource &
  LibraryPoolContentAttributes &
  LibraryPoolContentRelationships;
