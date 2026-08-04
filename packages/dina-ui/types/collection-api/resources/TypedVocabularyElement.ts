import { KitsuResource } from "kitsu";
import { MultilingualTitle } from "../../common";
import { VocabularyElementType } from "./VocabularyElementType";

export interface TypedVocabularyAttributes {
  id: string;
  term?: string;
  vocabularyElementType: VocabularyElementType;
  multilingualTitle?: MultilingualTitle;
}

export type TypedVocabulary = KitsuResource & TypedVocabularyAttributes;
