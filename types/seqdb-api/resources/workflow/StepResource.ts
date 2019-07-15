import { KitsuResource } from "kitsu";
import { PcrPrimer } from "../PcrPrimer";
import { Region } from "../Region";
import { Sample } from "../Sample";
import { Chain } from "./Chain";

export interface StepResourceAttributes {
  chainTemplateId: number;
  stepTemplateId: number;
  type: string;
  value: string;
}

export interface StepResourceRelationships {
  chain: Chain;
  region?: Region;
  primer?: PcrPrimer;
  sample?: Sample;
}

export type StepResource = KitsuResource &
  StepResourceAttributes &
  StepResourceRelationships;
