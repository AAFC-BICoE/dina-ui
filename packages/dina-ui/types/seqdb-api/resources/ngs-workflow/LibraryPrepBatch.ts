import { KitsuResource } from "kitsu";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { ContainerType } from "../ContainerType";
import { Product } from "../Product";
import { ThermocyclerProfile } from "../ThermocyclerProfile";
import { IndexSet } from "./IndexSet";
import { LibraryPrep } from "./LibraryPrep";

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
  containerType?: ContainerType;
  product?: Product;
  protocol?: Protocol;
  indexSet?: IndexSet;
  thermocyclerProfile?: ThermocyclerProfile;
  libraryPreps?: LibraryPrep[];
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;
