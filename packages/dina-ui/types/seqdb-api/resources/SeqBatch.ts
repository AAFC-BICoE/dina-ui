import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { Protocol } from "../../collection-api";
import { Person } from "../../objectstore-api";
import { Region } from "./Region";
import { ThermocyclerProfile } from "./ThermocyclerProfile";

export interface SeqBatchAttributes {
  type: "seq-batch";
  name: string;
  group?: string;
  isCompleted: boolean;
  sequencingType?: string;
  reactionDate?: string;
  storageRestriction?: any;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqBatchRelationships {
  /** UUID array (from the back-end JSON) or Person array (in the form state). */
  experimenters?: Person[];
  region?: Region;
  thermocyclerProfile?: ThermocyclerProfile;
  protocol?: Protocol;
  storageUnitType?: ResourceIdentifierObject;
  storageUnit?: ResourceIdentifierObject;
}

export type SeqBatch = KitsuResource &
  SeqBatchAttributes &
  SeqBatchRelationships;
