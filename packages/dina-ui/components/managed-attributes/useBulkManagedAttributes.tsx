import useSWR from "swr";
import { SimpleSearchFilterBuilder, useApiClient } from "common-ui";
import _ from "lodash";
import {
  ControlledVocabularyItem,
  ManagedAttribute
} from "../../types/collection-api";
import { COLLECTION_MANAGED_ATTRIBUTE_ID } from "../controlled-vocabulary/controlledVocabularyItemUtils";
import { PersistedResource } from "kitsu";

export interface UseBulkGetParams {
  /**
   * The base API path for the managed attributes or controlled vocabulary items.
   *
   * e.g., "collection-api/managed-attribute" or "collection-api/controlled-vocabulary-item"
   */
  baseApiPath: string;

  /**
   * The DINA component to use when filtering.
   *
   * e.g. "MATERIAL_SAMPLE" for managed attributes or controlled vocabulary items.
   */
  dinaComponent?: string;

  /**
   * The keys of the managed attributes or controlled vocabulary items to fetch.
   *
   * e.g. ["attribute_1", "attribute_2"]
   */
  keys: string[];

  /**
   * If true, disables fetching of managed attributes or controlled vocabulary items.
   */
  disabled?: boolean;

  /**
   * If true, fetches controlled vocabulary items instead of managed attributes.
   */
  isControlledVocabulary?: boolean;

  /**
   * Controlled Vocabulary UUID used to scope managed attributes. Defaults to the collection managed attribute vocabulary.
   */
  controlledVocabularyId?: string;
}

export interface BulkManagedAttributesResponse {
  /**
   * The fetched managed attributes or controlled vocabulary items.
   */
  data:
    | PersistedResource<ManagedAttribute | ControlledVocabularyItem>[]
    | undefined;

  /**
   * True if the fetch is in progress.
   */
  loading: boolean;
}

/**
 * Fetches managed attributes or controlled vocabulary items in bulk based on the provided keys and other parameters.
 */
export function useBulkManagedAttributes({
  baseApiPath,
  dinaComponent = "",
  keys,
  disabled = false,
  isControlledVocabulary = false,
  controlledVocabularyId = COLLECTION_MANAGED_ATTRIBUTE_ID
}: UseBulkGetParams): BulkManagedAttributesResponse {
  const { apiClient } = useApiClient();

  const fetchResources = async (keysToFetch: string[]) => {
    const headers = {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json"
    };

    const { data } = await apiClient.get<
      (ManagedAttribute | ControlledVocabularyItem)[]
    >(baseApiPath, {
      header: headers,
      filter: SimpleSearchFilterBuilder.create()
        .whereIn("key", keysToFetch)
        .when(!!dinaComponent, (builder) =>
          builder.where(
            isControlledVocabulary
              ? "dinaComponent"
              : "managedAttributeComponent",
            "EQ",
            dinaComponent
          )
        )
        .when(isControlledVocabulary, (builder) =>
          builder.where(
            "controlledVocabulary.uuid",
            "EQ",
            controlledVocabularyId
          )
        )
        .build(),
      page: { limit: keysToFetch.length }
    });

    return data ?? [];
  };

  const shouldFetch = keys?.length > 0 && !disabled;

  const { data: fetchResponse, isValidating } = useSWR(
    shouldFetch
      ? [
          baseApiPath,
          keys,
          dinaComponent,
          isControlledVocabulary,
          controlledVocabularyId
        ]
      : null,
    () => fetchResources(keys)
  );

  return { data: fetchResponse, loading: isValidating };
}
