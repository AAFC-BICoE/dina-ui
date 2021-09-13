export interface IdentifierAttributes {
  type?: IdentifierType;
  uri?: string;
}

export enum IdentifierType {
  ORCID = "ORCID",
  WIKIDATA = "WIKIDATA"
}

export type Identifier = IdentifierAttributes;
