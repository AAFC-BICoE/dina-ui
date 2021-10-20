export interface InstitutionIdentifierAttributes {
  type?: InstitutionIdentifierType;
  uri?: string;
}

export enum InstitutionIdentifierType {
  GRSCICOLL = "GRSCICOLL"
}

export type InstitutionIdentifier = InstitutionIdentifierAttributes;
