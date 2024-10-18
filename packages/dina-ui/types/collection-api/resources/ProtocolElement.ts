import { TypedVocabulary } from "./TypedVocabularyElement";

export interface ProtocolElementAttributes {
  type: "protocol-element";
}

export type ProtocolElement = TypedVocabulary & ProtocolElementAttributes;
