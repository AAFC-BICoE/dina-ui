import { KitsuResource } from "kitsu";
import { PcrPrimer } from "../PcrPrimer";
import { Region } from "../Region";
import { Sample } from "../Sample";
import { Chain } from "./Chain";
import { ChainStepTemplate } from "./ChainStepTemplate";
import { LibraryPool } from "./LibraryPool";
import { LibraryPrep } from "./LibraryPrep";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { PreLibraryPrep } from "./PreLibraryPrep";

export interface StepResourceAttributes {
  type: string;
  value: string;
}

export interface StepResourceRelationships {
  // Client-side only. These properties can be set on the client-side for convenience
  // because the API can't include the prelibraryprep or libraryprep for a requested sample.
  shearingPrep?: PreLibraryPrep;
  sizeSelectionPrep?: PreLibraryPrep;
  libraryPrep?: LibraryPrep;

  chainStepTemplate: ChainStepTemplate;
  chain: Chain;
  libraryPrepBatch?: LibraryPrepBatch;
  libraryPool?: LibraryPool;
  region?: Region;
  preLibraryPrep?: PreLibraryPrep;
  primer?: PcrPrimer;
  sample?: Sample;
}

export type StepResource = KitsuResource &
  StepResourceAttributes &
  StepResourceRelationships;
