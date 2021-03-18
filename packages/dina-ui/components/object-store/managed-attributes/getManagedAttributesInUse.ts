import { ApiClientI } from "common-ui";
import {
  ManagedAttribute,
  ManagedAttributeMap
} from "../../../types/objectstore-api";

/**
 * Initializes the editable managed attributes based on what attributes are set on the metadatas.
 */
export async function getManagedAttributesInUse(
  managedAttributeMaps: (ManagedAttributeMap["values"] | null | undefined)[],
  bulkGet: ApiClientI["bulkGet"],
  {
    apiBaseUrl = "/objectstore-api",
    managedAttributePath = "/managed-attribute"
  } = {}
) {
  // Loop through the metadatas and find which managed attributes are set:
  const managedAttributeIdMap: Record<string, true> = {};
  for (const values of managedAttributeMaps) {
    const keys = Object.keys(values ?? {});
    for (const key of keys) {
      managedAttributeIdMap[key] = true;
    }
  }
  const managedAttributeIds = Object.keys(managedAttributeIdMap);

  // Fetch the managed attributes from the back-end:
  const newInitialEditableManagedAttributes = await bulkGet<ManagedAttribute>(
    managedAttributeIds.map(id => `${managedAttributePath}/${id}`),
    { apiBaseUrl }
  );

  return newInitialEditableManagedAttributes;
}
