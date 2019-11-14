import { KitsuResource } from "kitsu";
import { Sample } from "../Sample";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { NgsIndex } from "./NgsIndex";

interface LibraryPrepAttributes {
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  wellColumn?: number | null;
  wellRow?: string | null;
}

interface LibraryPrepRelationships {
  libraryPrepBatch: LibraryPrepBatch;
  sample: Sample;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;
