import { KitsuResource } from "kitsu";
import { ContainerType } from "../ContainerType";
import { PcrProfile } from "../PcrProfile";
import { Product } from "../Product";
import { Protocol } from "../../../collection-api";
import { IndexSet } from "./IndexSet";

interface LibraryPrepBatchAttributes {
  type: "library-prep-batch";
  name: string;
  totalLibraryYieldNm?: number | null;
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
