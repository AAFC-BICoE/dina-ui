import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../../baseRelationshipParser";
import { IndexSet } from "./IndexSet";

export interface NgsIndexAttributes {
  type: "ngs-index";
  name: string;
  createdBy?: string;
  createdOn?: string;
  lotNumber?: number;
  direction?: string;
  purification?: string;
  tmCalculated?: string;
  dateOrdered?: string;
  dateDestroyed?: string;
  application?: string;
  reference?: string;
  supplier?: string;
  designedBy?: string;
  stockConcentration?: string;
  notes?: string;
  litReference?: string;
  primerSequence?: string;
  miSeqHiSeqIndexSequence?: string;
  miniSeqNextSeqIndexSequence?: string;
}

export interface NgsIndexRelationships {
  indexSet?: IndexSet | null;
}

export type NgsIndex = KitsuResource &
  NgsIndexAttributes &
  NgsIndexRelationships;

// Response types (what comes from API)
export interface NgsIndexResponseAttributes {
  type: "ngs-index";
  name: string;
  createdBy?: string;
  createdOn?: string;
  lotNumber?: number;
  direction?: string;
  purification?: string;
  tmCalculated?: string;
  dateOrdered?: string;
  dateDestroyed?: string;
  application?: string;
  reference?: string;
  supplier?: string;
  designedBy?: string;
  stockConcentration?: string;
  notes?: string;
  litReference?: string;
  primerSequence?: string;
  miSeqHiSeqIndexSequence?: string;
  miniSeqNextSeqIndexSequence?: string;
}

export interface NgsIndexResponseRelationships {
  indexSet?: {
    data?: PersistedResource<IndexSet>;
  };
}

export type NgsIndexResponse = KitsuResource &
  NgsIndexResponseAttributes &
  NgsIndexResponseRelationships;

/**
 * Parses a `PersistedResource<NgsIndexResponse>` object and transforms it into a `PersistedResource<NgsIndex>`.
 *
 * This function omits specific relationship properties from the input ngs index and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<NgsIndexResponse>`.
 * @returns The parsed ngs index resource, of type `PersistedResource<NgsIndex>`.
 */
export function ngsIndexParser(
  data: PersistedResource<NgsIndexResponse>
): PersistedResource<NgsIndex> {
  const parsedNgsIndex = baseRelationshipParser(
    ["indexSet"],
    data
  ) as PersistedResource<NgsIndex>;

  return parsedNgsIndex;
}
