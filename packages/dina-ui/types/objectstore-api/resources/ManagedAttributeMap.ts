import { KitsuResource } from "kitsu";
import { Metadata } from "./Metadata";

export interface ManagedAttributeMapAttributes {
  values: ManagedAttributeValues;
}

export type ManagedAttributeValues = {
  [managedAttributeId: string]: ManagedAttributeValue;
};

export interface ManagedAttributeValue {
  name?: string;
  value?: string;
  assignedValue?: string;
}

export interface ManagedAttributeMapRelationships {
  metadata?: Metadata;
}

export type ManagedAttributeMap = KitsuResource &
  ManagedAttributeMapAttributes &
  ManagedAttributeMapRelationships;
