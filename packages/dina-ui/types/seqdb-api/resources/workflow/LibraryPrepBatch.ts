import { KitsuResource } from "kitsu";
import { ContainerType } from "../ContainerType";
import { ThermocyclerProfile } from "../ThermocyclerProfile";
import { Product } from "../Product";
import { ResourceIdentifierObject } from "jsonapi-typescript";
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
  protocol?: ResourceIdentifierObject | null;
  indexSet?: IndexSet | null;
  thermocyclerProfile?: ThermocyclerProfile | null;
}

export type LibraryPrepBatch = KitsuResource &
  LibraryPrepBatchAttributes &
  LibraryPrepBatchRelationships;
