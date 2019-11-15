import { KitsuResource } from "kitsu";
import { Group } from "./Group";
import { Region } from "./Region";

export interface PcrPrimerAttributes {
  name: string;
  type: string;
  seq: string;
  lotNumber: number;

  // Optional fields
  version?: number | null;
  designDate?: string | null;
  direction?: string | null;
  tmCalculated?: string | null;
  tmPe?: number | null;
  position?: string | null;
  storage?: string | null;
  restrictionSite?: string | null;
  used4sequencing?: boolean | null;
  used4qrtpcr?: boolean | null;
  used4nestedPcr?: boolean | null;
  used4genotyping?: boolean | null;
  used4cloning?: boolean | null;
  used4stdPcr?: boolean | null;
  referenceSeqDir?: string | null;
  referenceSeqFile?: string | null;
  urllink?: string | null;
  note?: string | null;
  lastModified?: string | null;
  application?: string | null;
  reference?: string | null;
  targetSpecies?: string | null;
  supplier?: string | null;
  dateOrdered?: string | null;
  purification?: string | null;
  designedBy?: string | null;
  stockConcentration?: string | null;
}

export interface PcrPrimerRelationships {
  region?: Region;
  group?: Group;
}

export type PcrPrimer = KitsuResource &
  PcrPrimerAttributes &
  PcrPrimerRelationships;
