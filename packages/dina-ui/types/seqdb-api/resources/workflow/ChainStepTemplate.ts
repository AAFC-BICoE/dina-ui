import { KitsuResource } from "kitsu";
import { ChainTemplate } from "./ChainTemplate";
import { StepTemplate } from "./StepTemplate";

export interface ChainStepTemplateAttributes {
  type: "chain-step-template";
  stepNumber: number;
}

export interface ChainStepTemplateRelationships {
  chainTemplate: ChainTemplate;
  stepTemplate: StepTemplate;
}

export type ChainStepTemplate = KitsuResource &
  ChainStepTemplateAttributes &
  ChainStepTemplateRelationships;
