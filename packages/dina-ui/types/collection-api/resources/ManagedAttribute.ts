import { KitsuResource } from "kitsu";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

export interface ManagedAttributeAttributes<TComponent = string> {
  type: "managed-attribute";
  name: string;
  vocabularyElementType: VocabularyElementType;
  unit?: string;
  managedAttributeComponent?: TComponent;
  acceptedValues?: string[] | null;
  key: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
  multilingualDescription?: MultilingualDescription;
}

export type VocabularyElementType =
  | "INTEGER"
  | "DECIMAL"
  | "STRING"
  | "PICKLIST"
  | "DATE"
  | "BOOL";

export const COLLECTION_MODULE_TYPES = [
  "ASSEMBLAGE",
  "COLLECTING_EVENT",
  "DETERMINATION",
  "MATERIAL_SAMPLE",
  "ORGANISM",
  "PREPARATION"
] as const;
export type CollectionModuleType = (typeof COLLECTION_MODULE_TYPES)[number];
export const COLLECTION_MODULE_TYPE_LABELS: Record<
  CollectionModuleType,
  string
> = {
  ASSEMBLAGE: "assemblage",
  COLLECTING_EVENT: "collectingEvent",
  DETERMINATION: "determination",
  MATERIAL_SAMPLE: "materialSample",
  ORGANISM: "organism",
  PREPARATION: "preparation"
};

export const SEQDB_MODULE_TYPES = ["GENERIC_MOLECULAR_ANALYSIS"] as const;
export type SeqDBModuleType = (typeof SEQDB_MODULE_TYPES)[number];
export const SEQDB_MODULE_TYPE_LABELS: Record<SeqDBModuleType, string> = {
  GENERIC_MOLECULAR_ANALYSIS: "genericMolecularAnalysis"
};

export const MANAGED_ATTRIBUTE_TYPE_OPTIONS: {
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

export type ManagedAttribute<TComponent = string> = KitsuResource &
  ManagedAttributeAttributes<TComponent> &
  HasDinaMetaInfo;

export type ManagedAttributeValues = {
  [managedAttributeId: string]: string;
};
