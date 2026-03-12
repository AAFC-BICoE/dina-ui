import { KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";
import { ControlledVocabulary } from "./ControlledVocabulary";

export interface ControlledVocabularyItemAttributes {
  type: "controlled-vocabulary-item";
  name: string;
  key: string;
  group: string;
  vocabClass?: string;
  term?: string;
  multilingualTitle?: MultilingualTitle;
  multilingualDescription?: MultilingualDescription;
  vocabularyElementType?: string;
  acceptedValues?: string[];
  unit?: string;
  dinaComponent?: string;
  createdOn?: string;
  createdBy?: string;
}

export interface ControlledVocabularyItemRelationships {
  controlledVocabulary?: ControlledVocabulary;
}

export type ControlledVocabularyItem = KitsuResource &
  ControlledVocabularyItemAttributes &
  ControlledVocabularyItemRelationships;
