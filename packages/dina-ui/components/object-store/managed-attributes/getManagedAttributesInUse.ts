import { ApiClientI } from "common-ui";
import { flatMap, keys, uniq } from "lodash";
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
    managedAttributePath = "/managed-attribute",
    managedAttributeKeyField = "id",
    /** Prefix before the key when doing a Managed Attribute lookup e.g. COLLECTING_EVENT */
    keyPrefix = ""
  } = {}
) {
  // Get all unique ManagedAttribute keys in the given value maps:
  const managedAttributeKeys = uniq(flatMap(managedAttributeMaps.map(keys)));

  // Fetch the managed attributes from the back-end:
  const newInitialEditableManagedAttributes = await bulkGet<ManagedAttribute>(
    managedAttributeKeys.map(
      key => `${managedAttributePath}/${keyPrefix ? keyPrefix + "." : ""}${key}`
    ),
    { apiBaseUrl, returnNullForMissingResource: true }
  );

  return newInitialEditableManagedAttributes.map(
    // If the Managed Attribute is missing from the back-end then return a shallow copy with just the key field:
    (attr, index) =>
      attr ?? { [managedAttributeKeyField]: managedAttributeKeys[index] }
  );
}
