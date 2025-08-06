import { KitsuResource } from "kitsu";
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
  indexSet: IndexSet;
}

export type NgsIndex = KitsuResource &
  NgsIndexAttributes &
  NgsIndexRelationships;

export function ngsIndexParser(ngsIndex) {
  ngsIndex.indexSet = ngsIndex.indexSet?.data;

  return ngsIndex;
}
