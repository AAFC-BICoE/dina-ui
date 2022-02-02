import { KitsuResource } from "kitsu";
import { CollectionModuleType } from "./ManagedAttribute";

export interface ManagedAttributesViewAttributes {
  type: "managed-attributes-view";

  name?: string;
  managedAttributeComponent?: CollectionModuleType;
  attributeUuids?: string[];
}

export type ManagedAttributesView = KitsuResource &
  ManagedAttributesViewAttributes;
