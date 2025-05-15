import { Person } from "../../agent-api/resources/Person";
import { ManagedAttributeValues } from "./ManagedAttribute";

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
  scientificNameClassification?: ScientificNameSourceDetails;
  isFiledAs?: boolean;
  determinationRemarks?: string;
  managedAttributes?: ManagedAttributeValues;
}

export type ScientificNameSourceDetails = {
  labelHtml?: string;
  sourceUrl?: string;
  recordedOn?: string;
  isSynonym?: boolean;
  currentName?: string;
} & ClassificationItem;

export type ClassificationItem = {
  classificationPath?: string;
  classificationRanks?: string;
};

export type ClassificationItemWithId = ClassificationItem & { id: string };

export enum ScientificNameSource {
  COLPLUS = "COLPLUS",
  GNA = "GNA",
  CUSTOM = "CUSTOM"
}
