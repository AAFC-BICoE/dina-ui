import { ApiClientI } from "common-ui";
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
  useKeyInFilter: boolean,
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
  const newInitialEditableManagedAttributes = await bulkGet<
    ManagedAttribute,
    true
  >(
    managedAttributeKeys.map(key => {
      let queryUrl = `${managedAttributePath}/${
        keyPrefix ? keyPrefix + "." : ""
      }${key}`;
      if (useKeyInFilter)
        queryUrl = `${managedAttributePath}?filter[key]=${key}&page[limit]=1`;
      return queryUrl;
    }),
    { apiBaseUrl, returnNullForMissingResource: true }
  );

  return compact(newInitialEditableManagedAttributes).map(
    // If the Managed Attribute is missing from the back-end then return a shallow copy with just the key field:
    (attr, index) =>
      attr ?? { [managedAttributeKeyField]: managedAttributeKeys[index] }
  );
}
