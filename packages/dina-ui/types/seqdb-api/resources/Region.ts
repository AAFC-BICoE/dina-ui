import { KitsuResource } from "kitsu";
import { object, string } from "yup";

export interface RegionAttributes {
  type: "region";
  group?: string;
  name: string;
  description: string;
  symbol: string;
}

export const RegionImport = object({
  name: string().required(),
  description: string().required(),
  symbol: string().required(),
  group: string()
}).label("region");

export type Region = KitsuResource & RegionAttributes;
