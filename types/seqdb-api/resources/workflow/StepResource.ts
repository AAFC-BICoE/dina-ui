import { KitsuResource } from "kitsu";
import { PcrPrimer } from "../PcrPrimer";
import { Region } from "../Region";
import { Sample } from "../Sample";
import { Chain } from "./Chain";
import { ChainStepTemplate } from "./ChainStepTemplate";
import { PreLibraryPrep } from "./PreLibraryPrep";

export interface StepResourceAttributes {
  type: string;
  value: string;
}

export interface StepResourceRelationships {
  chainStepTemplate: ChainStepTemplate;
  chain: Chain;
  region?: Region;
  preLibraryPrep?: PreLibraryPrep;
  primer?: PcrPrimer;
  sample?: Sample;
}

export type StepResource = KitsuResource &
  StepResourceAttributes &
  StepResourceRelationships;
