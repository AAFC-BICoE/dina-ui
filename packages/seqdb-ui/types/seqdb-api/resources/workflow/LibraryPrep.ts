import { KitsuResource } from "kitsu";
import { Sample } from "../Sample";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { NgsIndex } from "./NgsIndex";

interface LibraryPrepAttributes {
  inputNg?: number;
  quality?: string;
  size?: string;
  wellColumn?: number;
  wellRow?: string;
}

interface LibraryPrepRelationships {
  libraryPrepBatch: LibraryPrepBatch;
  sample?: Sample;
  indexI5?: NgsIndex;
  indexI7?: NgsIndex;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;
