import { KitsuResource } from "kitsu";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";

export interface ManagedAttributeAttributes<TComponent = string> {
  type: string;
  name: string;
  managedAttributeType: string;
  managedAttributeComponent: TComponent;
  acceptedValues?: string[] | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

export type ManagedAttributeType = "INTEGER" | "STRING" | "PICKLIST";

export const COLLECTION_MODULE_TYPES = [
  "COLLECTING_EVENT",
  "MATERIAL_SAMPLE"
] as const;
export type CollectionModuleType = typeof COLLECTION_MODULE_TYPES[number];
export const COLLECTION_MODULE_TYPE_LABELS: Record<
  CollectionModuleType,
  string
> = {
  COLLECTING_EVENT: "collectingEvent",
  MATERIAL_SAMPLE: "materialSample"
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
  }
];

export type ManagedAttribute<TComponent = string> = KitsuResource &
  ManagedAttributeAttributes<TComponent>;
