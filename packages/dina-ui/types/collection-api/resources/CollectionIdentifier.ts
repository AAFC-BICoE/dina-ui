export interface CollectionIdentifierAttributes {
  type?: CollectionIdentifierType;
  uri?: string;
}

export enum CollectionIdentifierType {
  GRSCICOLL = "GRSCICOLL",
  INDEX_HERBARIORUM = "INDEX_HERBARIORUM"
}

export type CollectionIdentifier = CollectionIdentifierAttributes;
