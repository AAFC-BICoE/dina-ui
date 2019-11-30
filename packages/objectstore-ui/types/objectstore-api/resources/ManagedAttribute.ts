import { KitsuResource } from "kitsu";

export interface ManagedAttributeAttributes {
  type: "managed-attribute";
  name: string;
  managedAttributeType: ManagedAttributeType;
  acceptedValues: string[];
  uuid: string;
}
export enum ManagedAttributeType {
  INTEGER,
  STRING
}

export type ManagedAttribute = KitsuResource & ManagedAttributeAttributes;
