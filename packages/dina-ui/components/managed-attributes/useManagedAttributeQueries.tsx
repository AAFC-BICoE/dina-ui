import useSWR from "swr";
import { SimpleSearchFilterBuilder, useApiClient } from "common-ui";
import _ from "lodash";
import {
  ControlledVocabularyItem,
  ManagedAttribute
} from "../../types/collection-api";

export interface UseBulkGetParams {
  managedAttributeApiPath: string;
  managedAttributeComponent?: string;
  keys: string[];
  disabled?: boolean;
  isControlledVocabulary?: boolean;
}

/**
 * Custom React hook to fetch multiple managed attribute resources concurrently using their keys and not ids.
 *
 * @param {Object} params - Parameters for fetching managed attributes.
 * @param {string} params.managedAttributeApiPath - Base API path for managed attributes.
 * @param {string} params.managedAttributeComponent - Component name used to construct resource URLs.
 * @param {string[]} params.keys - Array of managed attribute keys to fetch.
 * @param {boolean} [params.disabled=false] - If true, disables fetching.
 * @param {boolean} [params.isControlledVocabulary=false] - If true, fetches controlled vocabulary items instead of managed attributes.
 * @returns {Object} An object containing:
 *   - data: Array of fetched managed attribute data, or undefined if not fetched.
 *   - loading: Boolean indicating if the fetch is in progress.
 *
 * @remarks
 * - Uses SWR for data fetching and caching.
 * - Handles errors for individual fetches, returning only successfully fetched resources.
 */
export function useManagedAttributeQueries({
  managedAttributeApiPath,
  managedAttributeComponent = "",
  keys,
  disabled = false,
  isControlledVocabulary = false
}: UseBulkGetParams) {
  const { apiClient } = useApiClient();

  const fetchResources = async (keys: string[]) => {
    const headers = {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "Crnk-Compact": "true"
    };

    const promises = keys.map((key) =>
      apiClient.get<ManagedAttribute | ControlledVocabularyItem>(
        managedAttributeApiPath,
        {
          header: headers,
          filter: SimpleSearchFilterBuilder.create()
            .when(!!managedAttributeComponent, (builder) =>
              builder.where(
                isControlledVocabulary
                  ? "dinaComponent"
                  : "managedAttributeComponent",
                "EQ",
                managedAttributeComponent!
              )
            )
            .where("key", "EQ", key)
            .build()
        }
      )
    );

    // Catch errors for each promise to avoid failing the entire batch.
    const caught_promises = promises.map((promise) =>
      promise.catch(() => null)
    );

    // Concurrently fetch all resources using single API calls.
    const results = await Promise.all(caught_promises);

    // Filter out any null results (e.g. if the resource was not found).
    return _.compact(results).flatMap((result) => _.castArray(result.data));
  };

  const shouldFetch = keys?.length > 0 && !disabled;

  const { data: fetchResponse, isValidating } = useSWR(
    shouldFetch ? keys : null,
    () => fetchResources(keys)
  );

  const data = fetchResponse;

  return { data, loading: isValidating };
}
