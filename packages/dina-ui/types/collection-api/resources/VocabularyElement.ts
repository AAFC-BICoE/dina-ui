import { KitsuResource } from "kitsu";

export interface VocabularyAttributes {
  vocabularyElements?: VocabularyElement[];
}

export type MultilingualTitle = { lang: string; title: string };

export interface VocabularyElement {
  key: string;
  name?: string;
  term?: string;
  multilingualTitle?: { titles?: MultilingualTitle[] };
}

export type Vocabulary = KitsuResource & VocabularyAttributes;
