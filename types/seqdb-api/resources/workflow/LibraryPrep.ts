import { KitsuResource } from "kitsu";
import { PcrPrimer } from "../PcrPrimer";
import { Sample } from "../Sample";
import { LibraryPrepBatch } from "./LibraryPrepBatch";

interface LibraryPrepAttributes {
  inputNg?: number;
  quality?: string;
  size?: string;
}

interface LibraryPrepRelationships {
  libraryPrepBatch?: LibraryPrepBatch;
  sample?: Sample;
  indexI5?: PcrPrimer;
  indexI7?: PcrPrimer;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;
