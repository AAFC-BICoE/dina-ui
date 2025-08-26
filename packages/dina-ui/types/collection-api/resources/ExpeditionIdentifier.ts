export interface ExpeditionIdentifierAttributes {
  type?: ExpeditionIdentifierType;
  uri?: string;
}

export enum ExpeditionIdentifierType {
  WIKIDATA = "WIKIDATA"
}

export type ExpeditionIdentifier = ExpeditionIdentifierAttributes;
