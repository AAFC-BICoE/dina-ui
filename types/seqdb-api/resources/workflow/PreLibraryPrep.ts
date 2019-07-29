import { KitsuResource } from "kitsu";
import { Product, Protocol } from "../..";

export interface PreLibraryPrepAttributes {
  preLibraryPrepType: string;
  inputAmount: number;
  targetDpSize: number;
  averageFragmentSize: number;
  concentration: number;
  quality: string;
  notes: string;
}

export interface PreLibraryPrepRelationships {
  protocol?: Protocol;
  produt?: Product;
}

export type PreLibraryPrep = KitsuResource &
  PreLibraryPrepAttributes &
  PreLibraryPrepRelationships;
