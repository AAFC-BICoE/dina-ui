import { KitsuResource } from "kitsu";
import { Product, Protocol } from "../..";

export interface PreLibraryPrepAttributes {
  preLibraryPrepType: string;
  inputAmount: number;
  targetBpSize: number;
  averageFragmentSize: number;
  concentration: number;
  quality: string;
  notes: string;
}

export interface PreLibraryPrepRelationships {
  protocol?: Protocol;
  product?: Product;
}

export type PreLibraryPrep = KitsuResource &
  PreLibraryPrepAttributes &
  PreLibraryPrepRelationships;
