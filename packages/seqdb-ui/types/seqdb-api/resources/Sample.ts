import { KitsuResource } from "kitsu";
import { Group } from "./Group";

export interface SampleAttributes {
  name: string;
}

export interface SampleRelationships {
  group?: Group;
}

export type Sample = KitsuResource & SampleAttributes & SampleRelationships;
