import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";

export type VocabularyElementType =
  | "INTEGER"
  | "DECIMAL"
  | "STRING"
  | "PICKLIST"
  | "DATE"
  | "BOOL";

export const VOCABULARY_ELEMENT_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: VocabularyElementType;
}[] = [
  {
    labelKey: "field_vocabularyElementType_integer_label",
    value: "INTEGER"
  },
  {
    labelKey: "field_vocabularyElementType_decimal_label",
    value: "DECIMAL"
  },
  {
    labelKey: "field_vocabularyElementType_text_label",
    value: "STRING"
  },
  {
    labelKey: "field_vocabularyElementType_picklist_label",
    value: "PICKLIST"
  },
  {
    labelKey: "field_vocabularyElementType_date_label",
    value: "DATE"
  },
  {
    labelKey: "field_vocabularyElementType_boolean_label",
    value: "BOOL"
  }
];
