import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { Protocol } from "../../collection-api";
import { Person } from "../../objectstore-api";
import { PcrPrimer } from "./PcrPrimer";
import { Region } from "./Region";

export interface PcrBatchAttributes {
  type: "pcr-batch";
  name: string;
  group?: string;
  isCompleted: boolean;
  batchType?: string;
  createdBy?: string;
  createdOn?: string;

  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: Person[];

  positiveControl?: string;
  reactionVolume?: string;
  reactionDate?: string;
  thermocycler?: string;
  objective?: string;
}

export interface PcrBatchRelationships {
  primerForward?: PcrPrimer;
  primerReverse?: PcrPrimer;
  region?: Region;
  attachment?: ResourceIdentifierObject[];
  storageUnit?: ResourceIdentifierObject;
  protocol?: Protocol;
}

export type PcrBatch = KitsuResource &
  PcrBatchAttributes &
  PcrBatchRelationships;
