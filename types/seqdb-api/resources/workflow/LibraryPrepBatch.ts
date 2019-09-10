import { KitsuResource } from "kitsu";
import { Product } from "../Product";
import { Protocol } from "../Protocol";

interface LibraryPrepBatchAttributes {
  totalLibraryYieldNm?: number;
  notes?: string;
  cleanUpNotes?: string;
  yieldNotes?: string;
}

interface LibraryPrepBatchRelationships {
  product?: Product;
  protocol?: Protocol;
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;
