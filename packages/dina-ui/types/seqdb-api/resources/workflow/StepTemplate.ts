import { KitsuResource } from "kitsu";

export interface StepTemplateAttributes {
  type: "step-template";
  name: string;
  inputs: string[];
  outputs: string[];
  supports: string[];
}

export type StepTemplate = KitsuResource & StepTemplateAttributes;
