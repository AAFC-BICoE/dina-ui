import { KitsuResource } from "kitsu";
import { ContainerType } from "../ContainerType";
import { PcrProfile } from "../PcrProfile";
import { Product } from "../Product";
import { Protocol } from "../Protocol";
import { IndexSet } from "./IndexSet";

interface LibraryPrepBatchAttributes {
  totalLibraryYieldNm?: number;
  notes?: string;
  cleanUpNotes?: string;
  yieldNotes?: string;
}

interface LibraryPrepBatchRelationships {
  containerType?: ContainerType;
  product?: Product;
  protocol?: Protocol;
  indexSet?: IndexSet;
  thermocyclerProfile?: PcrProfile;
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;
