import { KitsuResource } from "kitsu";

export interface ChainTemplateAttributes {
  type: "chain-template";
  name: string;
}

export type ChainTemplate = KitsuResource & ChainTemplateAttributes;
