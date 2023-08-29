import { KitsuResource } from "kitsu";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { ContainerType } from "../ContainerType";
import { Product } from "../Product";
import { ThermocyclerProfile } from "../ThermocyclerProfile";
import { IndexSet } from "../workflow/IndexSet";
import { LibraryPrep2 } from "./LibraryPrep2";

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
  libraryPreps?: LibraryPrep2[];
}

export type LibraryPrepBatch2 = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;
