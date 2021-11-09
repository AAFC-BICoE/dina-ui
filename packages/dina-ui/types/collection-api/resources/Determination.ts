import { Person } from "../../agent-api/resources/Person";

export interface Determination {
  verbatimScientificName?: string;
  verbatimDeterminer?: string;
  verbatimDate?: string;
  typeStatus?: string;
  typeStatusEvidence?: string;
  determiner?: (string | Person)[];
  determinedOn?: string;
  qualifier?: string;
  scientificNameSource?: ScientificNameSource;
  scientificNameDetails?: string;
  scientificName?: string;
  transcriberRemarks?: string;
  isPrimary?: boolean;
  scientificNameSourceDetails?: ScientificNameSourceDetails;
}

export type ScientificNameSourceDetails = {
  labelHtml?: string;
  sourceUrl?: string;
  recordedOn?: string;
};

export enum ScientificNameSource {
  COLPLUS = "COLPLUS"
}
