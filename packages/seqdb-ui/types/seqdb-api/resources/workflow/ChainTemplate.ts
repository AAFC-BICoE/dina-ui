import { KitsuResource } from "kitsu";

export interface ChainTemplateAttributes {
  name: string;
}

export type ChainTemplate = KitsuResource & ChainTemplateAttributes;
