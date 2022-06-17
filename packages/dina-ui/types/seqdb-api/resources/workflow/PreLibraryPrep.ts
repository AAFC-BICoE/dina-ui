import { KitsuResource } from "kitsu";
import { Product } from "../..";
import { ResourceIdentifierObject } from "jsonapi-typescript";

export interface PreLibraryPrepAttributes {
  type: "pre-library-prep";
  preLibraryPrepType: string;
  inputAmount: number;
  targetBpSize: number;
  averageFragmentSize: number;
  concentration: number;
  quality: string;
  notes: string;
  group?: string;
}

export interface PreLibraryPrepRelationships {
  protocol?: ResourceIdentifierObject;
  product?: Product;
}

export type PreLibraryPrep = KitsuResource &
  PreLibraryPrepAttributes &
  PreLibraryPrepRelationships;
