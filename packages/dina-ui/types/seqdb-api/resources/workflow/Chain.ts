import { KitsuResource } from "kitsu";
import { ChainTemplate } from "./ChainTemplate";

export interface ChainAttributes {
  name: string;
  createdOn?: string;
}

export interface ChainRelationships {
  chainTemplate: ChainTemplate;
}

export type Chain = KitsuResource & ChainAttributes & ChainRelationships;
