import { KitsuResource } from "kitsu";
import { IndexSet } from "../ngs-workflow/IndexSet";
import { Protocol } from "../../../collection-api";

export interface MetagenomicsBatchAttributes {
  type: "metagenomics-batch";
  name: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface MetagenomicsBatchRelationships {
  protocol?: Protocol;
  indexSet?: IndexSet;
}

export type MetagenomicsBatch = KitsuResource &
  MetagenomicsBatchAttributes &
  MetagenomicsBatchRelationships;
