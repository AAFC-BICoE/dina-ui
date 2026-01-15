import { KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";

export interface ControlledVocabularyAttributes {
  type: "controlled-vocabulary";
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

export type ControlledVocabulary = KitsuResource &
  ControlledVocabularyAttributes;
