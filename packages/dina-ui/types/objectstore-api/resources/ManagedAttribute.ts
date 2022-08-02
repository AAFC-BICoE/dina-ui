import { KitsuResource } from "kitsu";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
import { MultilingualDescription } from "../../common";

export interface ManagedAttributeAttributes {
  type: string;
  name: string;
  key: string;
  managedAttributeType: string;
  acceptedValues?: string[] | null;
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

export type ManagedAttribute = KitsuResource & ManagedAttributeAttributes;
