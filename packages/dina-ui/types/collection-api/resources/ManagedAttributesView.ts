import { KitsuResource } from "kitsu";
import { CollectionModuleType } from "./ManagedAttribute";

export interface ManagedAttributesViewAttributes {
  type: "managed-attributes-view";

  name?: string;
  group?: string;
  managedAttributeComponent?: CollectionModuleType;
  attributeKeys?: string[];
}

export type ManagedAttributesView = KitsuResource &
  ManagedAttributesViewAttributes;
