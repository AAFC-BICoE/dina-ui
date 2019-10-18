import { KitsuResource } from "kitsu";
import { Group } from "../Group";
import { ChainTemplate } from "./ChainTemplate";

export interface ChainAttributes {
  name: string;
  dateCreated: string;
}

export interface ChainRelationships {
  chainTemplate: ChainTemplate;
  group?: Group;
}

export type Chain = KitsuResource & ChainAttributes & ChainRelationships;
