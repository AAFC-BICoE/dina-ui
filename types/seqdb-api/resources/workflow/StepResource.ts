import { KitsuResource } from "kitsu";
import { PcrPrimer } from "../PcrPrimer";
import { Region } from "../Region";
import { Sample } from "../Sample";
import { Chain } from "./Chain";
import { ChainStepTemplate } from "./ChainStepTemplate";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { PreLibraryPrep } from "./PreLibraryPrep";

export interface StepResourceAttributes {
  type: string;
  value: string;
}

export interface StepResourceRelationships {
  // Client-side only. These properties can be set on the client-side for convenience
  // because the API can't include the prelibraryprep for a requested sample.
  shearingPrep?: PreLibraryPrep;
  sizeSelectionPrep?: PreLibraryPrep;

  chainStepTemplate: ChainStepTemplate;
  chain: Chain;
  libraryPrepBatch?: LibraryPrepBatch;
  region?: Region;
  preLibraryPrep?: PreLibraryPrep;
  primer?: PcrPrimer;
  sample?: Sample;
}

export type StepResource = KitsuResource &
  StepResourceAttributes &
  StepResourceRelationships;
