import { KitsuResource } from "kitsu";

export interface RegionAttributes {
  type: "region";
  group?: string;
  name: string;
  description: string;
  symbol: string;
}

export type Region = KitsuResource & RegionAttributes;
