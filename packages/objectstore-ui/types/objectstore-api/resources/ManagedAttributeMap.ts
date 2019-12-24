import { KitsuResource } from "kitsu";
import { Metadata } from "./Metadata";

interface ManagedAttributeMapAttributes {
  values: { [managedAttributeId: string]: ManagedAttributeValue };
}

interface ManagedAttributeValue {
  name?: string;
  value: string;
}

interface ManagedAttributeMapRelationships {
  metadata?: Metadata;
}

export type ManagedAttributeMap = KitsuResource &
  ManagedAttributeMapAttributes &
  ManagedAttributeMapRelationships;
