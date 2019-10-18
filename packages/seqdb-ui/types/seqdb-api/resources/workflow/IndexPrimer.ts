import { KitsuResource } from "kitsu";
import { IndexSet } from "./IndexSet";

export interface IndexPrimerAttributes {
  type: "indexPrimer";
  name: string;
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

export interface IndexPrimerRelationships {
  indexSet: IndexSet;
}

export type IndexPrimer = KitsuResource &
  IndexPrimerAttributes &
  IndexPrimerRelationships;
