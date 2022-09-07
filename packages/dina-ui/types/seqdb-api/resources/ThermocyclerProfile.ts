import { KitsuResource } from "kitsu";
import { Region } from "./Region";

export interface ThermocyclerProfileAttributes {
  name: string;
  // Optional fields
  group?: string;
  cycles?: string | null;
  lastModified?: string | null;
  application?: string | null;
  steps?: string[];
}

export interface ThermocyclerProfileRelationships {
  region?: Region;
}

export type ThermocyclerProfile = KitsuResource &
  ThermocyclerProfileAttributes &
  ThermocyclerProfileRelationships;
