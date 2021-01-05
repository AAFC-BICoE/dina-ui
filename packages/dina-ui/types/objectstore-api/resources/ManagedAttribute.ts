import { KitsuResource } from "kitsu";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";

export interface ManagedAttributeAttributes {
  type: string;
  name: string;
  managedAttributeType: string;
  acceptedValues?: string[] | null;
  createdBy?: string;
  createdOn?: string;
  description?: Map<string, string>;
}

export type ManagedAttributeType = "INTEGER" | "STRING";

export const MANAGED_ATTRIBUTE_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: ManagedAttributeType;
}[] = [
  {
    labelKey: "field_managedAttributeType_integer_label",
    value: ManagedAttributeType.INTEGER
  },
  {
    labelKey: "field_managedAttributeType_text_label",
    value: ManagedAttributeType.STRING
  },
  {
    labelKey: "field_managedAttributeType_picklist_label",
    value: ManagedAttributeType.PICKLIST
  }
];

export type ManagedAttribute = KitsuResource & ManagedAttributeAttributes;
