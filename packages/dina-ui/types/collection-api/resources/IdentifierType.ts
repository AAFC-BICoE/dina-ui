import { TypedVocabulary } from "./TypedVocabularyElement";

export interface IdentifierTypeAttributes {
  type: "identifier-type";
}

export type IdentifierType = TypedVocabulary & IdentifierTypeAttributes;
