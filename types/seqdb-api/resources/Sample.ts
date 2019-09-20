import { KitsuResource } from "kitsu";
import { Group } from "./Group";
import { Location } from "./Location";

export interface SampleAttributes {
  name: string;
}

export interface SampleRelationships {
  group?: Group;
  location?: Location;
}

export type Sample = KitsuResource & SampleAttributes & SampleRelationships;
