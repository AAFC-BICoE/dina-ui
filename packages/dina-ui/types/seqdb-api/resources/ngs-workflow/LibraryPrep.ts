import { KitsuResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { NgsIndex } from "./NgsIndex";
import { LibraryPrepBatch } from "./LibraryPrepBatch";

interface LibraryPrepAttributes {
  type: "library-prep";
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  wellColumn?: number | null;
  wellRow?: string | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPrepRelationships {
  libraryPrepBatch: LibraryPrepBatch;
  materialSample?: MaterialSample;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;
