import { KitsuResource } from "kitsu";
import { MolecularSample } from "../MolecularSample";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { NgsIndex } from "./NgsIndex";

interface LibraryPrepAttributes {
  type: "library-prep";
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  wellColumn?: number | null;
  wellRow?: string | null;
  group: string;
}

interface LibraryPrepRelationships {
  libraryPrepBatch: LibraryPrepBatch;
  molecularSample: MolecularSample;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;
