import { KitsuResource } from "kitsu";
import { ContainerType } from "../ContainerType";
import { IndexSet } from "../IndexSet";
import { PcrProfile } from "../PcrProfile";
import { Product } from "../Product";
import { Protocol } from "../Protocol";

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
