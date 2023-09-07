import { KitsuResource } from "kitsu";
import { NgsIndex } from "./NgsIndex";

export interface IndexSetAttributes {
  type: "index-set";
  name: string;
  forwardAdapter?: string;
  reverseAdapter?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface IndexSetRelationships {
  ngsIndexes?: NgsIndex[];
}

export type IndexSet = KitsuResource &
  IndexSetAttributes &
  IndexSetRelationships;
