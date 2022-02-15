import { ApiClientI } from "common-ui";
import { KitsuResponse } from "kitsu";
import { compact, flatMap, keys, uniq } from "lodash";
import {
  ManagedAttribute,
  ManagedAttributeValues
} from "../../../types/objectstore-api";

/**
 * Initializes the editable managed attributes based on what attributes are set on the metadatas.
 */
export async function getManagedAttributesInUse(
  managedAttributeMaps: (
    | ManagedAttributeValues
    | Record<string, string | undefined | null>
    | null
    | undefined
  )[],
  bulkGet: ApiClientI["bulkGet"],
  {
    apiBaseUrl = "/objectstore-api",
    managedAttributePath = "/managed-attribute"
  } = {}
) {
  // Get all unique ManagedAttribute keys in the given value maps:
  const managedAttributeKeys = uniq(flatMap(managedAttributeMaps.map(keys)));

  // Fetch the managed attributes from the back-end:
  const newInitialEditableManagedAttributes = await bulkGet<
    ManagedAttribute,
    true
  >(
    managedAttributeKeys.map(key => `${managedAttributePath}/${key}`),
    { apiBaseUrl, returnNullForMissingResource: true }
  );

  return compact(newInitialEditableManagedAttributes).map(
    // If the Managed Attribute is missing from the back-end then return a shallow copy with just the key field:
    (attr, index) => attr ?? { key: managedAttributeKeys[index] }
  );
}
