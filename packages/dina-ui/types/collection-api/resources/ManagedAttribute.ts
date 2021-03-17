import { KitsuResource } from "kitsu";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";

export interface ManagedAttributeAttributes {
  type: string;
  name: string;
  managedAttributeType: string;
  managedAttributeComponent: string;
  acceptedValues?: string[] | null;
  createdBy?: string;
  createdOn?: string;
}

export type ManagedAttributeType = "INTEGER" | "STRING" | "PICKLIST";

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

export type ManagedAttribute = KitsuResource & ManagedAttributeAttributes;
