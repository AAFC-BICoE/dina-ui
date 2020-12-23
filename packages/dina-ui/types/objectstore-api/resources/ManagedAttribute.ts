import { KitsuResource } from "kitsu";

export interface ManagedAttributeAttributes {
  type: string;
  name: string;
  managedAttributeType: string;
  acceptedValues?: string[];
  createdBy?: string;
  createdOn?: string;
  description?: Map<string, string>;
}
export enum ManagedAttributeType {
  INTEGER = "INTEGER",
  STRING = "STRING",
  PICKLIST = "PICKLIST"
}

export type ManagedAttribute = KitsuResource & ManagedAttributeAttributes;
