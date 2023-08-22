import { KitsuResource } from "kitsu";
import { Product } from "../..";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { Protocol } from "packages/dina-ui/types/collection-api";

export interface PreLibraryPrep2Attributes {
  type: "pre-library-prep";
  createdBy?: string;
  createdOn?: string;
  preLibraryPrepType: string;
  inputAmount: number;
  targetBpSize: number;
  averageFragmentSize: number;
  concentration: number;
  quality: string;
  notes: string;
  group?: string;
}

export interface PreLibraryPrep2Relationships {
  protocol?: Protocol;
  product?: Product;
}

export type PreLibraryPrep2 = KitsuResource &
  PreLibraryPrep2Attributes &
  PreLibraryPrep2Relationships;
