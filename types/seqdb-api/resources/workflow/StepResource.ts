import { KitsuResource } from "kitsu";
import { PcrPrimer } from "../PcrPrimer";
import { Region } from "../Region";
import { Chain } from "./Chain";

export interface StepResourceAttributes {
  dateCreated: string;
  name: string;
  type: string;
  value: string;
}

export interface StepResourceRelationships {
  chain: Chain;
  region?: Region;
  primer?: PcrPrimer;
}

export type StepResource = KitsuResource &
  StepResourceAttributes &
  StepResourceRelationships;
