import { KitsuResource } from "kitsu";

export interface VocabularyAttributes {
  vocabularyElements?: VocabularyElement[];
}

export interface VocabularyElement {
  name?: string;
  term?: string;
  labels?: Record<string, string | undefined>;
}

export type Vocabulary = KitsuResource & VocabularyAttributes;
