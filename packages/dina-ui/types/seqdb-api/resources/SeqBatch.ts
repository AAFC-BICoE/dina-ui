import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";
import { Region } from "./Region";

export interface SeqBatchAttributes {
  type: "seq-batch";
  name: string;
  group?: string;

  createdBy?: string;
  createdOn?: string;

  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: Person[];
}

export interface SeqBatchRelationships {
  region?: Region;
}

export type SeqBatch = KitsuResource &
  SeqBatchAttributes &
  SeqBatchRelationships;
