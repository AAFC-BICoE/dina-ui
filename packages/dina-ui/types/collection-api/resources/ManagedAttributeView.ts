import { KitsuResource } from "kitsu";
import { CollectionModuleType } from "./ManagedAttribute";

export interface ManagedAttributesViewAttributes {
  type: "managed-attributes-view";

  name?: string;
  managedAttributeComponent?: CollectionModuleType;
  keys?: string[];
}

export type ManagedAttributesView = KitsuResource &
  ManagedAttributesViewAttributes;
