import { KitsuResource } from "kitsu";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { Product } from "../Product";
import { ThermocyclerProfile } from "../ThermocyclerProfile";
import { IndexSet } from "./IndexSet";
import { LibraryPrep } from "./LibraryPrep";
import { ResourceIdentifierObject } from "jsonapi-typescript";

interface LibraryPrepBatchAttributes {
  type: "library-prep-batch";
  name: string;
  group?: string;
  totalLibraryYieldNm?: number;
  notes?: string;
  cleanUpNotes?: string;
  yieldNotes?: string;
  dateUsed?: string;
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPrepBatchRelationships {
  product?: Product;
  protocol?: Protocol;
  indexSet?: IndexSet;
  thermocyclerProfile?: ThermocyclerProfile;
  libraryPreps?: LibraryPrep[];
  storageUnit?: ResourceIdentifierObject;
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;

export function libraryPrepBatchParser(libraryPrepBatch) {
  libraryPrepBatch.product = libraryPrepBatch.product?.data;
  libraryPrepBatch.protocol = libraryPrepBatch.protocol?.data;
  libraryPrepBatch.indexSet = libraryPrepBatch.indexSet?.data;
  libraryPrepBatch.thermocyclerProfile =
    libraryPrepBatch.thermocyclerProfile?.data;
  libraryPrepBatch.storageUnit = libraryPrepBatch.storageUnit?.data;

  return libraryPrepBatch;
}
