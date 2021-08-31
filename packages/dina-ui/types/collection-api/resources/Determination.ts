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
}

export enum ScientificNameSource {
  COLPLUS = "COLPLUS"
}
