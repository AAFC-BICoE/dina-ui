import { KitsuResource } from "kitsu";

export interface RegionAttributes {
  group?: string;
  name: string;
  description: string;
  symbol: string;
}

export type Region = KitsuResource & RegionAttributes;
