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
  apiClient: ApiClientI["apiClient"],
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

  // Batch get all initial editable object store managed attributes
  const batchGetManagedAttributes = async () => {
    const promises: Promise<KitsuResponse<ManagedAttribute[], undefined>>[] =
      [];
    const params = managedAttributeKeys.map(key => {
      return { filter: { key: `${key}` }, page: { limit: 1 } };
    });
    params.map(param =>
      promises.push(
        apiClient.get<ManagedAttribute[], undefined>(
          `objectstore-api${managedAttributePath}`,
          param
        )
      )
    );
    const response = await Promise.all(promises);
    // It should return one result since key is unique
    return response.map(({ data }) => data?.[0]);
  };

  // Fetch the managed attributes from the back-end:
  const newInitialEditableManagedAttributes = useKeyInFilter
    ? await batchGetManagedAttributes()
    : await bulkGet<ManagedAttribute, true>(
        managedAttributeKeys.map(
          key =>
            `${managedAttributePath}/${keyPrefix ? keyPrefix + "." : ""}${key}`
        ),
        { apiBaseUrl, returnNullForMissingResource: true }
      );

  return compact(newInitialEditableManagedAttributes).map(
    // If the Managed Attribute is missing from the back-end then return a shallow copy with just the key field:
    (attr, index) =>
      attr ?? { [managedAttributeKeyField]: managedAttributeKeys[index] }
  );
}
