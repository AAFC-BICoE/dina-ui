import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { Region } from "./Region";

export interface PcrPrimerAttributes {
  type: "pcr-primer";
  name: string;
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
  region?: Region | null;
}

export type PcrPrimer = KitsuResource &
  PcrPrimerAttributes &
  PcrPrimerRelationships;

// Response types (what comes from API)
export interface PcrPrimerResponseAttributes {
  type: "pcr-primer";
  name: string;
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

export interface PcrPrimerResponseRelationships {
  region?: {
    data?: PersistedResource<Region>;
  };
}

export type PcrPrimerResponse = KitsuResource &
  PcrPrimerResponseAttributes &
  PcrPrimerResponseRelationships;

/**
 * Parses a `PersistedResource<PcrPrimerResponse>` object and transforms it into a `PersistedResource<PcrPrimer>`.
 *
 * This function omits specific relationship properties from the input PCR primer and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<PcrPrimerResponse>`.
 * @returns The parsed PCR primer resource, of type `PersistedResource<PcrPrimer>`.
 */
export function pcrPrimerParser(
  data: PersistedResource<PcrPrimerResponse>
): PersistedResource<PcrPrimer> {
  const parsedPcrPrimer = baseRelationshipParser(
    ["region"],
    data
  ) as PersistedResource<PcrPrimer>;

  return parsedPcrPrimer;
}
