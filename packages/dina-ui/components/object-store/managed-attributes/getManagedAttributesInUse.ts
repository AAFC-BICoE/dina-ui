import { ApiClientI } from "common-ui";
import {
  ManagedAttribute,
  ManagedAttributeMap
} from "../../../types/objectstore-api";

/**
 * Initializes the editable managed attributes based on what attributes are set on the metadatas.
 */
export async function getManagedAttributesInUse(
  managedAttributeMaps: (ManagedAttributeMap | null | undefined)[],
  bulkGet: ApiClientI["bulkGet"]
) {
  // Loop through the metadatas and find which managed attributes are set:
  const managedAttributeIdMap: Record<string, true> = {};
  for (const map of managedAttributeMaps) {
    const keys = Object.keys(map?.values ?? {});
    for (const key of keys) {
      managedAttributeIdMap[key] = true;
    }
  }
  const managedAttributeIds = Object.keys(managedAttributeIdMap);

  // Fetch the managed attributes from the back-end:
  const newInitialEditableManagedAttributes = await bulkGet<ManagedAttribute>(
    managedAttributeIds.map(id => `/managed-attribute/${id}`),
    { apiBaseUrl: "/objectstore-api" }
  );

  return newInitialEditableManagedAttributes;
}
