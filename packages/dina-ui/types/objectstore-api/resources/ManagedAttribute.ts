import { KitsuResource } from "kitsu";

export interface ManagedAttributeAttributes {
  type: string;
  name: string;
  managedAttributeType: string;
  acceptedValues?: string[] | null;
  createdBy?: string;
  createdOn?: string;
  description?: Map<string, string>;
}
export enum ManagedAttributeType {
  "INTEGER",
  "STRING"
}

export type ManagedAttribute = KitsuResource & ManagedAttributeAttributes;
