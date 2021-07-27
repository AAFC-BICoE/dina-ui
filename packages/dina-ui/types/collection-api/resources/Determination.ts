import { KitsuResource } from "kitsu";

export interface DeterminationAttributes {
  verbatimScientificName: string;
  verbatimAgent?: string;
  verbatimDate?: string;
  typeStatus?: string;
  typeStatusEvidence?: string;
  determiner?: string;
  determinedOn?: string;
  qualifier?: string;
}

export type Determination = KitsuResource & DeterminationAttributes;
