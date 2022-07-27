import { KitsuResource } from "kitsu";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
import { MultilingualDescription } from "../../common";

export interface ManagedAttributeAttributes<TComponent = string> {
  type: "managed-attribute";
  name: string;
  managedAttributeType: string;
  managedAttributeComponent: TComponent;
  acceptedValues?: string[] | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
  multilingualDescription?: MultilingualDescription;
}

export type ManagedAttributeType =
  | "INTEGER"
  | "STRING"
  | "PICKLIST"
  | "DATE"
  | "BOOL";

export const COLLECTION_MODULE_TYPES = [
  "COLLECTING_EVENT",
  "MATERIAL_SAMPLE",
  "DETERMINATION",
  "ASSEMBLAGE"
] as const;
export type CollectionModuleType = typeof COLLECTION_MODULE_TYPES[number];
export const COLLECTION_MODULE_TYPE_LABELS: Record<
  CollectionModuleType,
  string
> = {
  COLLECTING_EVENT: "collectingEvent",
  MATERIAL_SAMPLE: "materialSample",
  DETERMINATION: "determination",
  ASSEMBLAGE: "assemblage"
};

export const MANAGED_ATTRIBUTE_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: ManagedAttributeType;
}[] = [
  {
    labelKey: "field_managedAttributeType_integer_label",
    value: "INTEGER"
  },
  {
    labelKey: "field_managedAttributeType_text_label",
    value: "STRING"
  },
  {
    labelKey: "field_managedAttributeType_picklist_label",
    value: "PICKLIST"
  },
  {
    labelKey: "field_managedAttributeType_date_label",
    value: "DATE"
  },
  {
    labelKey: "field_managedAttributeType_boolean_label",
    value: "BOOL"
  }
];

export type ManagedAttribute<TComponent = string> = KitsuResource &
  ManagedAttributeAttributes<TComponent>;
