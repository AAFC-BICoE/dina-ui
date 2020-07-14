import { KitsuResource } from "kitsu";
import { ManagedAttribute } from "./ManagedAttribute";
import { Metadata } from "./Metadata";

export interface MetaManagedAttributeAttributes {
  type: "metadata-managed-attribute";
  uuid: string;
  assignedValue: string;
}

export interface MetaManagedAttributeRelationship {
  objectStoreMetadata: Metadata;
  managedAttribute: ManagedAttribute;
}

export type MetaManagedAttribute = KitsuResource &
  MetaManagedAttributeAttributes &
  MetaManagedAttributeRelationship;
