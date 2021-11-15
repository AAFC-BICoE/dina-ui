import { Person } from "../../agent-api/resources/Person";

export interface Determination {
  verbatimScientificName?: string;
  verbatimDeterminer?: string;
  verbatimDate?: string;
  typeStatus?: string;
  typeStatusEvidence?: string;
  determiner?: (string | Person)[];
  determinedOn?: string;
  verbatimRemarks?: string;
  scientificNameSource?: ScientificNameSource;
  scientificName?: string;
  transcriberRemarks?: string;
  isPrimary?: boolean;
  scientificNameDetails?: ScientificNameSourceDetails;
  isFileAs?: boolean;
  determinationRemarks?: string;
}

export type ScientificNameSourceDetails = {
  labelHtml?: string;
  sourceUrl?: string;
  recordedOn?: string;
};

export enum ScientificNameSource {
  COLPLUS = "COLPLUS"
}
