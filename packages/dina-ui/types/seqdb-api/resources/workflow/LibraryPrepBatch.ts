import { KitsuResource } from "kitsu";
import { ContainerType } from "../ContainerType";
import { PcrProfile } from "../PcrProfile";
import { Product } from "../Product";
import { Protocol } from "../Protocol";
import { IndexSet } from "./IndexSet";

interface LibraryPrepBatchAttributes {
  name: string;
  totalLibraryYieldNm?: number | null;
  type: "libraryPrepBatch";
  notes?: string | null;
  cleanUpNotes?: string | null;
  yieldNotes?: string | null;
}

interface LibraryPrepBatchRelationships {
  containerType?: ContainerType | null;
  product?: Product | null;
  protocol?: Protocol | null;
  indexSet?: IndexSet | null;
  thermocyclerProfile?: PcrProfile | null;
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;
