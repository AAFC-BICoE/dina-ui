import { KitsuResource } from "kitsu";

export interface StepTemplateAttributes {
  name: string;
  inputs: string[];
  outputs: string[];
  supports: string[];
}

export type StepTemplate = KitsuResource & StepTemplateAttributes;
