import { KitsuResource } from "kitsu";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { LibraryPrep2, Product } from "../..";

export type PreLibraryPrepType = "SHEARING" | "SIZE_SELECTION";

export interface PreLibraryPrep2Attributes {
  type: "pre-library-prep";
  createdBy?: string;
  createdOn?: string;
  preLibraryPrepType: PreLibraryPrepType;
  inputAmount?: number;
  targetBpSize?: number;
  averageFragmentSize?: number;
  concentration?: number;
  quality?: string;
  notes?: string;
  group?: string;
}

export interface PreLibraryPrep2Relationships {
  libraryPrep: LibraryPrep2;
  protocol?: Protocol;
  product?: Product;
}

export type PreLibraryPrep2 = KitsuResource &
  PreLibraryPrep2Attributes &
  PreLibraryPrep2Relationships;
