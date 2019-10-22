import { KitsuResource } from "kitsu";
import { Group } from "./Group";
import { Region } from "./Region";

export interface PcrPrimerAttributes {
  name: string;
  type: string;
  seq: string;
  lotNumber: number;

  // Optional fields
  version?: number;
  designDate?: string;
  direction?: string;
  tmCalculated?: string;
  tmPe?: number;
  position?: string;
  storage?: string;
  restrictionSite?: string;
  used4sequencing?: boolean;
  used4qrtpcr?: boolean;
  used4nestedPcr?: boolean;
  used4genotyping?: boolean;
  used4cloning?: boolean;
  used4stdPcr?: boolean;
  referenceSeqDir?: string;
  referenceSeqFile?: string;
  urllink?: string;
  note?: string;
  lastModified?: string;
  application?: string;
  reference?: string;
  targetSpecies?: string;
  supplier?: string;
  dateOrdered?: string;
  purification?: string;
  designedBy?: string;
  stockConcentration?: string;
}

export interface PcrPrimerRelationships {
  region?: Region;
  group?: Group;
}

export type PcrPrimer = KitsuResource &
  PcrPrimerAttributes &
  PcrPrimerRelationships;
