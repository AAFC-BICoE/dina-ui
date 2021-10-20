export interface PersonIdentifierAttributes {
  type?: PersonIdentifierType;
  uri?: string;
}

export enum PersonIdentifierType {
  ORCID = "ORCID",
  WIKIDATA = "WIKIDATA"
}

export type PersonIdentifier = PersonIdentifierAttributes;
