import { Person } from "../../agent-api/resources/Person";
import { ManagedAttributeValues } from "../../objectstore-api";

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
  managedAttributes?: ManagedAttributeValues;
}

export type ScientificNameSourceDetails = {
  labelHtml?: string;
  sourceUrl?: string;
  recordedOn?: string;
  classificationPath?: string;
  classificationRanks?: string;
  isSynonym?: boolean;
  currentName?: string;
};

export enum ScientificNameSource {
  COLPLUS = "COLPLUS",
  GNA = "GNA"
}
