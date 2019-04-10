import { KitsuResource } from "kitsu";

export interface RegionAttributes {
  name: string;
  description: string;
  symbol: string;
}

export type Region = KitsuResource & RegionAttributes;
