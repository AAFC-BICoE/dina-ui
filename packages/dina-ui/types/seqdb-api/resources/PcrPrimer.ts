import { KitsuResource } from "kitsu";
import { Region } from "./Region";

export interface PcrPrimerAttributes {
  name: string;
  type: string;
  seq: string;
  lotNumber: number;

  // Optional fields
  group?: string;
  version?: number | null;
  designDate?: string | null;
  direction?: string | null;
  tmCalculated?: string | null;
  tmPe?: number | null;
  position?: string | null;
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
}

export type PcrPrimer = KitsuResource &
  PcrPrimerAttributes &
  PcrPrimerRelationships;
